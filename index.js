"use strict";
const fs = require("fs");
const pg = require("pg");
const axios = require("axios");

// Настройка подключения к базе данных
const config = {
    connectionString: "postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1",
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(`postgresql/RootCA.cer`).toString(),
    },
};

const conn = new pg.Client(config);

// Функция для создания таблицы и загрузки данных
const createTableAndLoadData = async () => {
    try {
        await conn.connect();
        console.log("Подключение успешно!");

        // Создание новой таблицы
        await conn.query(`
            CREATE TABLE magistr25 (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                data JSONB NOT NULL
            );
        `);
        console.log("Таблица создана успешно!");

        // Функция для загрузки всех страниц данных
        const loadAllPages = async (url) => {
            let nextPageUrl = url;
            while (nextPageUrl) {
                const response = await axios.get(nextPageUrl);
                const characters = response.data.results;
                for (const character of characters) {
                    const characterData = {
                        id: character.id,
                        name: character.name,
                        status: character.status,
                        species: character.species,
                        type: character.type,
                        gender: character.gender,
                        origin: character.origin,
                        location: character.location,
                        image: character.image,
                        episode: character.episode,
                        url: character.url,
                        created: character.created
                    };
                    await conn.query(`
                        INSERT INTO magistr25 (name, data) 
                        VALUES ($1, $2);
                    `, [character.name, characterData]);
                }
                nextPageUrl = response.data.info.next;
            }
        };

        // Загрузка всех данных из API Rick and Morty
        await loadAllPages("https://rickandmortyapi.com/api/character");

        console.log("Данные загружены успешно!");
    } catch (err) {
        console.error("Ошибка:", err);
    } finally {
        await conn.end();
    }
};

createTableAndLoadData();
