const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Block, Blockchain } = require('./blockchain'); // Import Block and Blockchain
require('dotenv').config();  // Load environment variables from .env

const app = express();
const port = process.env.PORT || 3000;

// Use service names for the nodes
const nodes = ['blockchain_node2_1:3000', 'blockchain_node3_1:3001', 'blockchain_node1_1:3002'];

app.use(bodyParser.json());

const blockchain = new Blockchain();

app.get('/blocks', (req, res) => {
    res.send(blockchain.chain);
});

app.post('/mine', (req, res) => {
    const newBlock = new Block(blockchain.chain.length, new Date().toISOString(), req.body.data);
    blockchain.addBlock(newBlock);

    nodes.forEach(node => {
        if (node !== `node${port - 2999}:3000`) { 
            axios.post(`http://${node}/receive`, { block: newBlock })
                .catch(error => {
                    console.error(`Error broadcasting to ${node}: ${error.message}`);
                });
        }
    });

    res.send(newBlock);
});

app.post('/receive', (req, res) => {
    const { block } = req.body;
    const newBlock = new Block(block.index, block.timestamp, block.data, block.previousHash);
    newBlock.hash = block.hash;
    newBlock.nonce = block.nonce;

    blockchain.chain.push(newBlock);

    res.send({ status: 'Block received and added to the chain' });
});

app.listen(port, () => {
    console.log(`Node running on port ${port}`);
});
