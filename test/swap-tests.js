const {
    expect
} = require("chai");

describe("Swap contract implemented correctly", function () {

    let owner;
    let user1;
    let user2;

    let swapContract;

    let sampleToken;
    let sampleTokenDecimals;

    beforeEach(async function () {
        // Get three accounts, including the contract owner
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy erc20 sample token
        const sampleTokenFactory = await ethers.getContractFactory("SampleToken");
        sampleToken = await sampleTokenFactory.deploy();
        await sampleToken.deployed();

        // Get decimal factor of the token
        sampleTokenDecimals = ethers.BigNumber.from(10).pow(await (sampleToken.decimals()))

        // Deploy the swap contract
        const swapContractFactory = await ethers.getContractFactory("Swap");
        swapContract = await swapContractFactory.deploy();
        await swapContract.deployed();

    });

    it("Simple swap transaction works", async function () {
        // Give the contract signer the initial supply of the ERC20 token
        var ownerStartingBalance = await sampleToken.balanceOf(
            await owner.getAddress()) / sampleTokenDecimals
        expect(ownerStartingBalance).to.equal(1000000);


        const sampleTokenSwapAmount = await ethers.BigNumber.from(1337).mul(sampleTokenDecimals);

        // Offer to sell 1337 sampleToken for 5 ether
        await swapContract.createSwap(sampleToken.address, sampleTokenSwapAmount, ethers.utils.parseEther("1337.0"));

        // Grant the swap contract access to 1337 sampletoken
        await sampleToken.approve(swapContract.address, sampleTokenSwapAmount);

        // Execute swap and pay
        await swapContract.connect(user1).fulfil(sampleToken.address, await owner.getAddress(), {
            value: ethers.utils.parseEther("1337.0")
        })

        // Check that swap was excuted correctly
        expect(await sampleToken.balanceOf(await user1.getAddress())).to.equal(sampleTokenSwapAmount);


    });

    it("A new swap offer for the same ERC20 token overwrites the previous one", async function () {
        // Give the contract signer the initial supply of the ERC20 token
        var ownerStartingBalance = await sampleToken.balanceOf(
            await owner.getAddress()) / sampleTokenDecimals
        expect(ownerStartingBalance).to.equal(1000000);


        const firstSwapAmount = await ethers.BigNumber.from(1337).mul(sampleTokenDecimals);

        const secondSwapAmount = await ethers.BigNumber.from(7331).mul(sampleTokenDecimals);
        // Offer to sell 1337 sampletoken
        await swapContract.createSwap(
            sampleToken.address,
            firstSwapAmount,
            ethers.utils.parseEther("1337.0"));

        // Add a new swap contract for the same currency,
        // thus overwriting the previous one
        await swapContract.createSwap(
            sampleToken.address,
            secondSwapAmount,
            ethers.utils.parseEther("7331.0"));


        // Grant the swap contract access to 7331 sampletoken
        await sampleToken.approve(swapContract.address, secondSwapAmount);

        // Execute swap and pay
        await swapContract.connect(user1).fulfil(
            sampleToken.address,
            await owner.getAddress(), {
                value: ethers.utils.parseEther("7331.0")
            })

        // Check that swap was excuted correctly
        expect(await sampleToken.balanceOf(await user1.getAddress())).to.equal(secondSwapAmount);

    });


    it("Swap offers are queryable by currency", async function () {
        // First user should create a swap
        await swapContract.createSwap(
            sampleToken.address,
            ethers.utils.parseEther("1.0"),
            ethers.utils.parseEther("1.0"));

        // Second user makes a swap for the same ERC20
        await swapContract.connect(user1).createSwap(
            sampleToken.address,
            ethers.utils.parseEther("1.0"),
            ethers.utils.parseEther("1.0"));

        expect((await swapContract.querySwaps(sampleToken.address))[2]).to.eql([
            await owner.getAddress(),
            await user1.getAddress()
        ])

    });
});