const MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
const MarbleNFT = artifacts.require("./MarbleNFT.sol");

const assertRevert = require('../utils/assertRevert');

const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const duration = 62; // seconds
const nonExistingToken = 999;

contract("MarbleAuctionTest", accounts => {
  let nftContract;
  let auctionContract;

  const owner = accounts[0];

  summer.account = accounts[1];
  beth.account = accounts[2];
  jerry.account = accounts[3];
  rick.account = accounts[4];
  morty.account = accounts[5];

  beforeEach(async () => {
   nftContract = await MarbleNFT.deployed();
   auctionContract = await MarbleDutchAuction.deployed();
  });

  it("returns correct count of Auctions after creation", async () => {
    // ini NFTs
    await nftContract.mint(rick.token, rick.account, rick.uri, rick.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(beth.token, beth.account, beth.uri, beth.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(summer.token, summer.account, summer.uri, summer.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(morty.token, morty.account, morty.uri, morty.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(jerry.token, jerry.account, jerry.uri, jerry.tokenUri, Date.now(), {from: owner});

    await auctionContract.createAuction(rick.token, 2*rick.payment, rick.payment, duration, {from: rick.account});
    await auctionContract.createAuction(beth.token, 2*beth.payment, beth.payment, duration, {from: beth.account});
    await auctionContract.createAuction(summer.token, 2*summer.payment, summer.payment, duration, {from: summer.account});
    await auctionContract.createAuction(morty.token, 2*morty.payment, morty.payment, duration, {from: morty.account});
    await auctionContract.createAuction(jerry.token, 2*jerry.payment, jerry.payment, duration, {from: jerry.account});

    assert.equal(await auctionContract.totalAuctions(), 5);
  });

  it("throws trying to create auction with not owned NFT", async () => {
    await assertRevert(auctionContract.createAuction(beth.token, 2*rick.payment, rick.payment, duration, {from: rick.account}));
  });

  it("throws trying to create auction with not existing NFT", async () => {
    await assertRevert(auctionContract.createAuction(nonExistingToken, 2*rick.payment, rick.payment, duration, {from: rick.account}));
  });

  it("throws trying to create auction with minimal price higher than starting price", async () => {
    await assertRevert(auctionContract.createAuction(jerry.token, jerry.payment, 2*jerry.payment, duration, {from: jerry.account}));
  });

  it("throws trying to cancel not owned auction", async () => {
    await assertRevert(auctionContract.cancelAuction(beth.token, {from: rick.account}));
  });

  it("checks auction existence", async () => {
    assert(await auctionContract.isOnAuction(beth.token));
  });

  it("checks auction non-existence", async () => {
    let exist = await auctionContract.isOnAuction(nonExistingToken);
    assert(!exist);
  });

  it("cancel auction", async () => {
    await auctionContract.cancelAuction(rick.token, {from: rick.account});
    assert.equal(await nftContract.ownerOf(rick.token), rick.account);
  });

  it("throws after underprice bid", async () => {
    await assertRevert(auctionContract.bid(summer.token, {from: morty.account, value: summer.payment - 1}));
  });

  it("throws after bid on non-existing auction", async () => {
    await assertRevert(auctionContract.bid(nonExistingToken, {from: morty.account, value: morty.payment}));
  });

  it("bid on classic auction", async () => {
    const events = auctionContract.AuctionSuccessful();
    let summersBalance = await web3.eth.getBalance(summer.account);

    await auctionContract.bid(summer.token, { from: morty.account, value: await auctionContract.getCurrentPrice(summer.token) });

    let auctioneerCut = await web3.eth.getBalance(auctionContract.address);

    events.get((err, res) => {
      assert(!err);

      assert.equal(res[0].event, "AuctionSuccessful");
      assert.equal(res[0].args.tokenId, summer.token);
      assert(auctioneerCut > 0, "auction contract has to gain cut :)");
      assert.equal(res[0].args.winner, morty.account);
    });

    assert(summersBalance + summer.payment < await web3.eth.getBalance(summer.account), "seller has to gain his revenue!");
    assert.equal(await nftContract.ownerOf(summer.token), morty.account);
  });

  it("pause contract", async () => {
    await auctionContract.pause({from: owner});
    assert(await auctionContract.paused());
  });

  it("throws trying to cancel by seller", async () => {
    await assertRevert(auctionContract.cancelAuction(morty.token, {from: morty.account}));
  });

  it("cancel auction when paused by admin", async () => {
    await auctionContract.cancelAuctionWhenPaused(morty.token, {from: owner});
    assert.equal(await nftContract.ownerOf(morty.token), morty.account);
  });

  it("throws trying to bid when paused", async () => {
    await assertRevert(auctionContract.bid(beth.token, {from: jerry.account, value: await auctionContract.getCurrentPrice(beth.token)}));
  });

  it("throws trying to remove auction without permision", async () => {
    await assertRevert(auctionContract.removeAuction(beth.token, {from: jerry.account}));
  });

  it("removes auction", async () => {
    assert(await auctionContract.isOnAuction(beth.token));
    await auctionContract.removeAuction(beth.token, {from: owner});
    let isIndeed = await auctionContract.isOnAuction(beth.token);
    assert(!isIndeed);
  });

  it("unpause contract", async () => {
    await auctionContract.unpause({from: owner});
    assert(!(await auctionContract.paused()));
  });

  it("throws trying to remove auction when not paused", async () => {
    await assertRevert(auctionContract.removeAuction(jerry.token, {from: owner}));
  });

  it("check current price when duration is over", async () => {
    console.log("Waiting for end of duration....")
    setTimeout(async () => {
      assert.equal(await auctionContract.getCurrentPrice(jerry.token), jerry.payment);
    }, duration*1000);
  });

  it("cancel auction when duration is over", async () => {
    console.log("Waiting for end of duration....")
    setTimeout(async () => {
      await auctionContract.cancelAuction(jerry.token, {from: jerry.account});
      assert.equal(await nftContract.ownerOf(jerry.token), jerry.account);
    }, duration*1000 + 5000);
  });

  it("throws trying to withdraw balance without permissions", async () => {
    setTimeout(async () => {
        await assertRevert(candidateContract.withdrawBalance({from: jerry.account}));
    }, duration*1000 + 5000);
  });

  it("withdraws auction contract balance", async () => {
    setTimeout(async () => {
      let ownersBalance = await web3.eth.getBalance(owner);
      await candidateContract.withdrawBalance({from: owner});

      assert.notEqual(ownersBalance, await web3.eth.getBalance(owner));
      assert.equal(await web3.eth.getBalance(candidateContract.address),0);
    }, duration*1000 + 8000);
  });

});
