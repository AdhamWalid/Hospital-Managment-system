const express = require('express')
const mongoose = require('mongoose')
const app = express()
const path = require('path')
const chalk = require('chalk')
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const session = require('express-session');

mongoose.connect('mongodb+srv://Adham:HadbZEOFMtb1iPTR@hospital.94gew.mongodb.net/hospital')
    .then(() => console.log(chalk`Database : {green  Stable}`))
    .catch(err => console.log(chalk`Database : {red Stable} \n ${err.message}`));


// ⁡⁢⁣⁢𝗗𝗮𝘁𝗮𝗯𝗮𝘀𝗲⁡⁡

const userSchema = mongoose.Schema({
    username : {type : String , required : true},
    email : {type: String , required : true},
    password : {type : String , required : true},
    type : {type: String , required : true , default : "patient"},
    phone : {type : Number , required : true }
})

const User = mongoose.model('Users', userSchema);


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up session middleware
app.use(session({
    secret: 'SECRET', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));


app.get('/', (req, res) => res.redirect('/home'));


app.get('/home', (req, res) => {
    res.render('home')

})
// Login

app.get('/login' , (req,res) => {
    
    res.render('login')
})

app.post('/login', async (req, res) => {
    const { email, password  , phone , username , type} = req.body;
    try {
        const user = await User.findOne({ username });


        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: 'Invalid login' });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.email = user.email
        req.session.type = user.type;
        req.session.phone = user.phone;
        
        res.redirect('/home')        
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
        console.log(error)
    }
});

// ⁡⁢⁢⁢Signup

app.get('/signup' , (req,res) => {
    res.render('signup')
})

app.post('/signup', async (req, res) => {

    const { username, email, password , phone} = req.body;
    console.log(req)

    try {
        if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already registered' });
        if (await User.findOne({ username })) return res.status(400).json({ error: 'Username already registered' });
        if (await User.findOne({ phone })) return res.status(400).json({ error: 'Number already registered' });

         const hashedPassword = await bcrypt.hash(password, 10);
        await new User({ username, email, password:hashedPassword , phone }).save();
        res.status(201).json({ message: 'Registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
        console.log(error)
    }
});


app.post('/logout', async (req, res) => {

    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.redirect('/home');
    });
});

// Home



// Profile
app.get('/profile' , async (req,res) => {
    if (!req.session.userId) {
        return res.redirect('/home');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.render('profile', {
            username: user.username,
            email: user.email,
            type: user.type,
            phone : user.phone,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
        console.error(error);
    }
})


app.use((req, res) => res.status(404).render('404'));


app.listen(3030 , () => {
    console.log(chalk`App : {green Stable}`)
})