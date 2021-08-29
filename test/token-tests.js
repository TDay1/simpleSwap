const {
    expect
} = require("chai");

describe("Sample ERC20 test token implemented correctly", function () {

    let owner;
    let user1;
    let user2;

    let sampleToken;
    let sampleTokenDecimals;

    beforeEach(async function () {
        // Get three accounts, including the contract owner
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy
        const sampleTokenFactory = await ethers.getContractFactory("SampleToken");
        sampletoken = await sampleTokenFactory.deploy();
        await sampletoken.deployed();

        // Get decimal factor of the token
        sampleTokenDecimals = ethers.BigNumber.from(10).pow(await (sampletoken.decimals()))



    });

    it("ERC20 sample token created with initial supply of 1mil", async function () {
        // Check that contract was deployed, with an initial supply of 1mil
        var ownerStartingBalance = await sampletoken.balanceOf(
            await owner.getAddress()) / sampleTokenDecimals
        expect(ownerStartingBalance).to.equal(1000000);
    });

    it("ERC20 token transfers/transfer approvals work", async function () {

        // Test that transfers work
        // Transfer 500k to the second account
        await sampletoken.transfer(await user1.getAddress(), ethers.BigNumber.from("500000").mul(sampleTokenDecimals))
        expect(await sampletoken.balanceOf(await user1.getAddress()) / sampleTokenDecimals).to.equal(500000)

        const userBalance = await sampletoken.balanceOf(await user1.getAddress())

        // Test that allowances/approvals work
        await sampletoken.connect(user1).approve(owner.getAddress(), userBalance);
        await sampletoken.transferFrom(user1.getAddress(), owner.getAddress(), userBalance);

        var ownerStartingBalance = await sampletoken.balanceOf(
            await owner.getAddress()) / sampleTokenDecimals
        expect(ownerStartingBalance).to.equal(1000000);


    });

});