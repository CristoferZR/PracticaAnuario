const express = require('express')
const mysql = mysql('mysql')
const app = express()
const ejs = require('ejs')
const bodyparser = require('body-parser')

 const DB_HOST = process.env.DB_HOST || 'localhost'
 const DB_USER = process.env.DB_USER || 'cris'
 const DB_PASS = process.env.DB_PASS || '1234'
 const DB_NAME = process.env.DB_NAME || 'veterinaria'
 const DB_PORT = process.env.DB_PORT || '3000'


const connection = mysql.createConnection({

    host : DB_HOST,
    user : DB_USER,
    password : DB_PASS,
    database : DB_NAME,
    port: DB_PORT

}) 

const router = express.Router();
