const chalk = require("chalk");
const boxen = require("boxen");

const yargs = require("yargs");
const axios = require("axios");
const expiredTime = 604800; // 1 week
const pokemonCache = require('node-file-cache').create({
    file: './cache/pokemons.txt',
    life: expiredTime
});
const searchCache = require('node-file-cache').create({
    file: './cache/search.txt',
    life: expiredTime
});

const successBoxen = {
 padding: 1,
 margin: 0,
 float: 'center',
 borderStyle: "round",
 borderColor: "green",
 backgroundColor: "#555555"
};
const errorBoxen = {
    padding: 1,
    margin: 0,
    float: 'center',
    borderStyle: "bold",
    borderColor: "red",
    backgroundColor: "#555555"
};

const options = yargs
    .usage("Usage: -n <name>")
    .option("n", {
        alias: "name",
        describe: "Your name",
        type: "string",
        demandOption: true
    })
    .option("s", {
        alias: "search",
        describe: "Search term (name or id)",
        type: "string",
        demandOption: true
    })
    .argv;

const greeting = `Hello, ${options.name}!`;
console.log(boxen( greeting, successBoxen ));

const url = `https://pokeapi.co/api/v2/pokemon?limit=12000`;
// pokemonCache.expire("allPokemons");

class Pokemon {
    constructor(keyword) {
        this.keyword = keyword.replace(' ', '-');
        this.allPokemons = pokemonCache.get("allPokemons");
        this.pokemon = {}
    }

    async getAllPokemons() {
        try {
            console.log("Fetching new data...")
            const {
                data
            } = await axios.get(url, {
                headers: {
                    Accept: "application/json"
                }
            });
            this.updatePokemons(data.results);
        } catch (err) {
            console.log(boxen(err.message, errorBoxen));
        }
    }

    updatePokemons(pokemons) {
        this.allPokemons = pokemons;
        pokemonCache.set("allPokemons", pokemons);
    }

    async findPokemon(req) {
        if(req === undefined) {
            console.log(boxen('no pokemon found', errorBoxen));
            return;
        }
        try {
            const {
                data
            } = await axios.get(req.url, {
                headers: {
                    Accept: "application/json"
                }
            });
            this.pokemon = (({
                id,
                name,
                type,
                location_area_encounters,
                stats
            }) => ({
                id,
                name,
                type,
                location_area_encounters,
                stats
            }))(data)
            console.log(boxen(req.name.toUpperCase(), successBoxen));
            console.log(this.pokemon);
        } catch (err) {
            console.log(boxen(err.message, errorBoxen));
        }
    }

    async init(callback) {
        if (this.allPokemons === null) await this.getAllPokemons();
        callback.bind(this)();
        const searchResult = this.allPokemons.find(x => x.name === this.keyword.toLowerCase() || x.url.search(`/${this.keyword}/`) !== -1)
        this.findPokemon(searchResult)
    }
}

let pokedex = new Pokemon(options.search);

pokedex.init(function () {
    let prefix = Number(pokedex.keyword)? 'ID: ': ''
    console.log(`Searching ${prefix}'${pokedex.keyword}' in ${pokedex.allPokemons.length} pokemons`)
});