const express = require('express')
const mongoose = require('mongoose')
const app = express()
const path = require('path')
const chalk = require('chalk')
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const session = require('express-session');
require('dotenv').config()

mongoose.connect('mongodb+srv://Adham:f6BFkacaENuEeoDY@hospital.94gew.mongodb.net/hospital')
    .then(() => console.log(chalk`Database : {green  Stable}`))
    .catch(err => console.log(chalk`Database : {red Stable} \n ${err.message}`));


// ⁡⁢⁣⁢𝗗𝗮𝘁𝗮𝗯𝗮𝘀𝗲⁡⁡

const userSchema = mongoose.Schema({
    username : {type : String , required : true},
    email : {type: String , required : true},
    password : {type : String , required : true},
    type : {type: String , required : true , default : "Patient"},
    phone : {type : Number , required : true }
})

const doctorSchema = mongoose.Schema({
    id : {type : Number , required : true},
    name : {type: String , required : true},
    password : {type : String , required : true},
    country : {type : String , required : true},
    speciality : {type: String , required : true},
    phone : {type : Number , required : true },

})

const appointmentSchema = new mongoose.Schema({
    name: String,
    contact: String,
    email: String,
    date: Date,
    time: String,
    department: String,
    reason: String
});




const User = mongoose.model('Patients', userSchema);
const Doctor = mongoose.model('Doctors', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);


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

app.get('/doctor/login' , (req,res) => {
    
    res.render('doclogin')
})

app.get('/search', async (req, res) => {
    const query = req.query.q;
    
    try {
        // Search in name, specialty, and department fields
        const doctors = await Doctor.find({
            $or: [
                { name: new RegExp(query, 'i') },
                { specialty: new RegExp(query, 'i') },
                { department: new RegExp(query, 'i') }
            ]
        });
        res.json(doctors);
    } catch (err) {
        console.error('Error finding doctors:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/agent/login' , (req,res) => {
    
    res.render('agentlogin')
})

app.get('/appointment', (req,res) =>{
    res.render('appointment')
})

app.post('/appointments', async (req, res) => {
    const { name, contact, email, date, time, department, reason } = req.body;

    try {
        const newAppointment = new Appointment({ name, contact, email, date, time, department, reason });
        await newAppointment.save();
        res.send('Appointment created successfully');
    } catch (err) {
        console.error('Error creating appointment:', err);
        res.status(500).send('Failed to create appointment');
    }
});

app.get('/agent/signup' , (req,res) => {
    
    res.render('agentsignup')
})

app.post('/agent/login', async (req, res) => {

    const { id, password  , name , speciality , phone  , country} = req.body;
    try {
        const doctor = await Doctor.findOne({ id });
        

        if (!doctor || password != doc.password) {
            return res.status(400).json({ error: '[INVALID] Contact IT Department.' });
        }

        req.session.docId = doctor._id;
        req.session.doc_id = doctor.id;
        req.session.doc_name = doctor.name;
        req.session.doc_speciality = doctor.speciality;
        req.session.doc_phone = doctor.phone;
        req.session.doc_country = doctor.country;


        
        // id : {type : Number , required : true},
        // password : {type : String , required : true},
        // name : {type: String , required : true},
        // country : {type : String , required : true},
        // speciality : {type: String , required : true},
        // phone : {type : Number , required : true },
        // age : {type : Number , required : true },



        res.redirect('/home')        
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
        console.log(error)
    }
});


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
        req.session.type = user.type
        req.session.phone = user.phone;
        
        res.redirect('/home')        
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
        console.log(error)
    }
});

app.post('/doctor/login', async (req, res) => {

    const { id , password , username} = req.body;
    try {
        const doc = await Doctor.findOne({ username });

        console.log(doc)
        if (!doc || !await bcrypt.compare(password, doc.password)) {
            return res.status(400).json({ error: 'Invalid login' });
        }

        req.session.userId = doc._id;
        req.session.username = doc.username;
        req.session.email = doc.email
        req.session.type = "Doctor";
        req.session.speciality = doc.speciality;
        req.session.country = doc.country;
        req.session.phone = doc.phone;
        
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


app.post('/agent/signup', async (req, res) => {

    const { id, name , password , country , speciality , phone} = req.body;
    console.log(req)

    try {
        if (await User.findOne({ id })) return res.status(400).json({ error: 'ID already registered' });

         const hashedPassword = await bcrypt.hash(password, 10);
        await new Doctor({ id, name, password:hashedPassword , country , speciality , phone}).save();
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



app.get('/appointments/list', async (req, res) => {

    try {
        const appointments = await Appointment.find();
        res.render('appointmentsList', { appointments });
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/doctor/list', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.render('doctorsList', { doctors , i:0 });
    } catch (err) {
        console.error('Error fetching Doctors:', err);
        res.status(500).send('Internal Server Error');
    }
});


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


// 404 route (must be the last route)
app.use((req, res) => {
    res.status(404).render('404');
});


app.listen(3030 , () => {
    console.log(chalk`App : {green Stable}`)
})