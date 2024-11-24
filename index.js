const express = require('express')
const path= require('path')
const {open}= require('sqlite')
const sqlite3 = require('sqlite3')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const app = express()
const dbPath= path.join(__dirname, 'users.db')

app.use(express.json())
app.use(cors())

let db

const initializaServer= async ()=>{
    try{
        db= await open({
            filename: dbPath,
            driver: sqlite3.Database
        })
        app.listen(3000, ()=>{console.log('Server is running at http://localhost:3000/')})

    }catch(e){
        console.log(`Server Error: ${e.message}`)
        process.exit(1)
    }
}

initializaServer()

//users Data
app.get('/api/users', async (req, res)=>{
    const sql=`select * from users;`
    const respo= await db.all(sql)
    res.send(respo)
})

app.delete('/api/users', async (req, res)=>{
    const deletSql= `DELETE FROM  users; `
    await db.run(deletSql)
    res.send('deleted Successfully')
})

// user registrations
app.post('/api/users/signin', async (req, res)=>{
    const {id, username, password}= req.body
    const userExistsSql= `
    Select * from users where username = "${username}";
    `
    const user= await db.get(userExistsSql)
    if (user === undefined){
        const hashedPassword= await bcrypt.hash(password, 10)
        const updateSql= `
            INSERT INTO users (id, 'username', 'password')
            VALUES ('${id}', "${username}", "${hashedPassword}");
        `
        await db.run(updateSql)
        res.status(200).json({message:"user Registered Successfully."});
    }else{
        res.status(400).json({message:'user Already exits. Please Login.'});
    }
    
})

// user login 
app.post('/api/users/login', async (req, res)=>{
    const {username, password}= req.body 
    const userSql= `
        Select * from users where username = "${username}";
    `
    const userData= await db.get(userSql)
    if (userData === undefined){
        res.status(400).json({message:'username is invalid. Please SignUp'});
        
    }else{
        const compPass= await bcrypt.compare(password, userData.password)
        if (compPass === true){
            const payload= {
                username : username
            }
            const jwtToken= jwt.sign(payload, 'MY_SECRETE_TOKEN')
            res.send({jwtToken})
        }else{
            res.status(404).json({message:'Incorrect Password'});
        }
    }
})