const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
app.use(cors());

app.use(express.json());

const users = [
    {
        id: 1,
        name: "adam",
        password: "length",
        isAdmin: true,
    },
    {
        id: 2,
        name: "eve",
        password: "jane",
        isAdmin: false,
    }
]

let refreshTokens = [];

app.post("/api/refresh", (req, res) => {
    console.log(333);
    const refreshToken = req.body.token;
    if (!refreshTokens.includes(refreshToken)){
        return res.status(403).json("Refresh token is not valid");
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log(err);
        };
        // return the tokens don't match the passed token by the user
        refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user); 

        refreshTokens.push(newRefreshToken); // store in DB and redis
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    });
});

app.post("/api/login", (req, res) => {
    console.log(22222);
    const { username, password } = req.body;
    
    const user = users.find( user => {
        return user.name === username && user.password === password;
    });
    if (!user){
        return res.status(401).json("User is not valid");
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user); 

    refreshTokens.push(newRefreshToken); // store in DB and redis

    res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    })
});

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json("Authentication fail")
    };
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err){
            return res.status(403).json("Token is not valid")
        };
        req.user = user;
        next();
    });

};

app.get("/api/dashboard", auth, (req, res) => {
    res.send("Hi from dashboard")
});

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            isAdmin: user.isAdmin
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE_TIME });
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            isAdmin: user.isAdmin
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE_TIME });
};

app.listen(5000, () => {
    console.log("Server start at port 5000")
})