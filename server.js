const express = require('express')
const mysql  = require('mysql2');
const app = express()
const ejs = require('ejs')
const multer = require("multer");
const bodyParser = require('body-parser');

app.use(express.json());

/*--------------Variables para la conexion a la base de datos------------*/

const PORT = process.env.PORT || 3000

 const DB_HOST = process.env.DB_HOST || 'localhost'
 const DB_USER = process.env.DB_USER || 'cris'
 const DB_PASS = process.env.DB_PASS || '1234'
 const DB_NAME = process.env.DB_NAME || 'anuario'
 const DB_PORT = process.env.DB_PORT || '3000'


const connection = mysql.createConnection({

    host : DB_HOST,
    user : DB_USER,
    password : DB_PASS,
    database : DB_NAME,
    
}) 

connection.connect((error) => {
    if (error) {
      console.error('Error connecting to database:', error);
    } else {
      console.log('Connected to database!');
    }
    });



//--------------Conexion a bd------------

app.listen(PORT);

const router = express.Router();

  app.set('view engine','ejs');
  app.use(bodyParser.urlencoded({ extended: true }));
  
  app.use('/', router);

  app.use(express.static(__dirname));


// Configuracion de multer
var upload = multer({
    dest: 'public/images',
    fileFilter : function(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg)$/)){
            return cb(new Error('Solo se permiten archivos JPG'));
        }
        cb(null, true);
    }// fin del fileFilter
})// fin del multer


// Formulario registro alumno

app.post("/register", upload.single('file'),(req,res)=>{

    var name = req.body.nombre
    var career = req.body.carrera

    var image = `public/images/${req.file.filename}`;

    var email = req.body.email
    var pass = req.body.password
    var interests = req.body.intereses
    var skills = req.body.habilidades
    var objectives = req.body.objetivos

    var sql = 'INSERT INTO estudiantes (nombre, carrera, imagen,email,password,intereses,habilidades,objetivos) VALUES(?,?,?,?,?,?,?,?)';

    connection.query(sql,[name,career,image,email,pass,interests,skills,objectives],function(err,res){
        if(err)throw err
    })

    res.redirect('/index.html')

})

// Formulario inicio sesion

const session = require('express-session');

app.use(session({
    secret: 'abcd1234',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // ajustar según sea necesario
  }));
  

app.post("/login",(req,res)=>{

    const email = req.body.email;
    const pass = req.body.password;

    connection.query('SELECT * FROM estudiantes where email = ? AND password=?',
    [email,pass],
    (error,results) =>{
        if (error){
            console.log(error)
            res.send('Ocurrió un error al intentar iniciar sesión');
        }else if (results.length>0){
            req.session.loggedin = true;
            req.session.user = results[0];
            res.redirect('/welcome');
        }else{
            res.send('Credenciales incorrectas');
        }

    }
    
    )
 })

 app.get('/welcome', (req, res) => {
    const user = req.session.user;

    res.render('welcome', { user});
  });



  //Cerrar sesion

  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/index.html');
      }
    });
  });



  //Mostrar alumnos sin sesion

  app.get('/alumnosInicio',(req,res)=>{
    connection.query('SELECT*FROM estudiantes',(error,rows)=>{
        if(error) throw error
        if (!error) {

            res.render('alumnosInicio',{rows})

        }

    })
  })

  //Mostrar proyectos sin sesion

  app.get('/proyectos',(req,res)=>{
    
    res.render('proyectos')
    
  })