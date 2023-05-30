const express = require('express')
const mysql  = require('mysql2');
const app = express()
const ejs = require('ejs')
const multer = require('multer');
const bodyParser = require('body-parser');

app.use(express.json());

/*--------------Variables para la conexion a la base de datos------------*/


const PORT = process.env.PORT || 3000
/*
 const DB_HOST = process.env.DB_HOST || 'localhost'
 const DB_USER = process.env.DB_USER || 'cris'
 const DB_PASS = process.env.DB_PASS || '1234'
 const DB_NAME = process.env.DB_NAME || 'anuario'
 const DB_PORT = process.env.DB_PORT || '3000'
*/

const connection = mysql.createConnection({

    host : 'localhost',
    user : 'cris',
    password : '1234',
    database : 'anuario',
    
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
    },
    // fin del fileFilter
})// fin del multer


// Formulario registro alumno

app.post("/register", upload.single('file'),(req,res)=>{

    const name = req.body.nombre
    const career = req.body.carrera

    const image = `public/images/${req.file.filename}`

    const email = req.body.email
    const pass = req.body.password
    const interests = req.body.intereses
    const skills = req.body.habilidades
    const objectives = req.body.objetivos
    const control = req.body.numero

    const sql = 'INSERT INTO estudiantes (nombre, carrera, imagen,email,password,intereses,habilidades,objetivos,no_control) VALUES(?,?,?,?,?,?,?,?,?)';

    connection.query(sql,[name,career,image,email,pass,interests,skills,objectives,control],function(err,res){
        if(err)throw err
    })

    res.redirect('/index.html')

})

app.post('/register3',upload.single('file'),(req,res)=>{

  const nombre = req.body.nombre
  const email = req.body.email
  const pass = req.body.password
  const image = `public/images/${req.file.filename}`

  const sql = 'INSERT INTO administradores(email,password,imagen,nombre) values(?,?,?,?)'

  connection.query(sql,[email,pass,image,nombre],(error,results)=>{
    if(error)throw error
  })
  res.redirect('welcome')

})

// Formulario inicio sesion

const session = require('express-session');

app.use(session({
    secret: 'abcd1234',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // ajustar según sea necesario
  }));
  

app.post("/login",(req,res)=>{

    const email = req.body.email;
    const pass = req.body.password;

    connection.query('SELECT * FROM administradores where email = ? AND password=?',
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
          connection.query('SELECT * FROM estudiantes where email=? AND password=?',[email,pass],(error,results)=>{
            if(error){
              console.log(error)
              res.send('Ocurrió un error al intentar iniciar sesión');
            }
            else if(results.length>0){
              req.session.loggedin = true;
              req.session.user = results[0];
              res.redirect('/welcomeEstudiante');
            }else{
              res.send('Credenciales incorrectas');
            }
          })
          
        }
    }
    
    )
 })

 app.get('/welcome', (req, res) => {
    const user = req.session.user;

    res.render('welcome', { user});
  });

  app.get('/welcomeEstudiante', (req, res) => {
    const user = req.session.user;

    res.render('welcomeEstudiante', { user});
  });

  app.get('/modificarEstudiante',(req,res)=>{

    const user = req.session.user;

    res.render('modificarEstudiante',{user})
  })

  app.post('/modificarEst',upload.single('file'),(req,res)=>{

    const control = req.body.id
    const nombre = req.body.nombre
    const carrera = req.body.carrera
    const email = req.body.email
    const intereses = req.body.intereses
    const habilidades = req.body.habilidades
    const objetivos = req.body.objetivos

    let imagen;
  if (req.file) {
    // Se ha seleccionado un nuevo archivo
    imagen = `public/images/${req.file.filename}`;
  } else {
    // No se ha seleccionado un archivo nuevo, mantener la misma imagen
    imagen = req.body.current_image;
  }

    connection.query('UPDATE estudiantes SET nombre=?, carrera=?, imagen=?, email=?, intereses=?, habilidades=?, objetivos=? WHERE no_control=?',
      [nombre, carrera,imagen, email, intereses, habilidades, objetivos, control], (error, results) => {
        if (error) throw error;
        if (!error) {
          res.redirect('welcomeEstudiante');
        }
      }
    );

  })


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

  //Mostrar alumnos en una sesion

  app.get('/alumnosSesion',(req,res)=>{
    connection.query('SELECT*FROM estudiantes',(error,rows)=>{
        if(error) throw error
        if (!error) {

            res.render('alumnosSesion',{rows})

        }

    })
  })

  //Mostrar proyectos en una sesion

  app.get('/proyectosSesion',(req,res)=>{

    connection.query('SELECT*FROM proyectos',(error,rows)=>{

      if(error) throw error
      if(!error){
        res.render('proyectosSesion',{rows})
      }

    })
    
  })

  //Detalle proyecto en una sesion

  app.get('/detalle-proyecto',(req,res)=>{

    const id = req.query.id

    connection.query('SELECT*FROM proyectos where id=?',[id],(error,results)=>{

        if(error)throw error
        if(!error){
          res.render('detalle-proyecto',{results})
        }


    })


  })

  //administrar alumnos
  app.get('/administracionAlumnos',(req,res)=>{

    connection.query('SELECT*FROM estudiantes',(error,rows)=>{
      if(error)throw error
      if(!error){
        res.render('administracionAlumnos',{rows})
      }

    })
    
  })

  //Detalle alumno en una sesion

  app.get('/detalle-alumno',(req,res)=>{

    const id = req.query.id

    connection.query('SELECT*FROM estudiantes where no_control=?',[id],(error,results)=>{

      if(error)throw error
      if(!error){

        res.render('detalle-alumno',{results})
      }

    })

  })

  //Detalle alumno sin sesion

  app.get('/detalle-alumno-nosesion',(req,res)=>{

    const id = req.query.id

    connection.query('SELECT*FROM estudiantes where no_control=?',[id],(error,results)=>{

      if(error)throw error
      if(!error){

        res.render('detalle-alumno-nosesion',{results})
      }

    })

  })


  app.post('/eliminar', (req, res) => {

    const id = req.body.id;

    connection.query('DELETE FROM estudiantes WHERE no_control=?',[id],
    (error,results)=>{
      if(error)throw error
      if(!error){
        res.redirect('administracionAlumnos')
      }

    }
    
    )

  });

  app.post('/actualizar', (req, res) => {
    const id = req.body.id;
    const nombre = req.body.nombre;
    const carrera = req.body.carrera;
    const email = req.body.email;
    const intereses = req.body.intereses;
    const habilidades = req.body.habilidades;
    const objetivos = req.body.objetivos;
  
    connection.query('UPDATE estudiantes SET nombre=?, carrera=?, email=?, intereses=?, habilidades=?, objetivos=? WHERE no_control=?',
      [nombre, carrera, email, intereses, habilidades, objetivos, id], (error, results) => {
        if (error) throw error;
        if (!error) {
          res.redirect('administracionAlumnos');
        }
      }
    );
  });

  app.post("/register2", upload.single('file'),(req,res)=>{

    var name = req.body.nombre
    var career = req.body.carrera

    var image = `public/images/${req.file.filename}`;

    var email = req.body.email
    var pass = req.body.password
    var interests = req.body.intereses
    var skills = req.body.habilidades
    var objectives = req.body.objetivos
    var control = req.body.numero

    var sql = 'INSERT INTO estudiantes (nombre, carrera, imagen,email,password,intereses,habilidades,objetivos,no_control) VALUES(?,?,?,?,?,?,?,?,?)';

    connection.query(sql,[name,career,image,email,pass,interests,skills,objectives,control],function(err,results){
        
      if(err)throw err
        if(!err){
          res.redirect('administracionAlumnos')
        }

    })

    

})


  //administrar proyectos

  app.get('/administracionProyectos', (req, res) => {
    const proyectoQuery = 'SELECT * FROM proyectos';
    const estudiantesQuery = 'SELECT * FROM estudiantes';
  
    connection.query(proyectoQuery, (errProyectos, proyectos) => {
      if (errProyectos) throw errProyectos;
  
      connection.query(estudiantesQuery, (errEstudiantes, estudiantes) => {
        if (errEstudiantes) throw errEstudiantes;
  
        const data = {
          proyectos: proyectos,
          estudiantes: estudiantes
        };
  
        res.render('administracionProyectos', { data });
      });
    });
  });



  //Mostrar proyectos sin sesion

  app.get('/proyectos',(req,res)=>{

    connection.query('SELECT*FROM proyectos',(error,rows)=>{
      if(error)throw error
      if(!error){
        res.render('proyectos',{rows})
      }

    })
    
  })

  //Detalle proyecto sin sesion

  app.get('/detalle-proyecto-nosesion',(req,res)=>{

    const id = req.query.id

    connection.query('SELECT*FROM proyectos where id=?',[id],(error,results)=>{

        if(error)throw error
        if(!error){
          res.render('detalle-proyecto-nosesion',{results})
        }


    })

  })

  //Registro proyecto

  app.get('/registroProyecto',(req,res)=>{

    connection.query('SELECT*FROM estudiantes',(error,rows)=>{

      if(error)throw error
      if(!error){
        res.render('registroProyecto',{rows})
      }

    })

  })


  
  app.post('/proyectos', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'files', maxCount: 2 }]), (req, res) => {
    // Extraer los datos del archivo principal
    const titulo = req.body.titulo;
    const autores = Array.isArray(req.body.autores) ? req.body.autores.join(', ') : req.body.autores;
    const descripcion_corta = req.body.descripcion_corta;
    const descripcion_larga = req.body.descripcion_larga;
    const image = `public/images/${req.files['file'][0].filename}`;
  
    // Extraer los datos de la imagen adicional
    let image2 = '';
    if (req.files['files']) {
      image2 = `public/images/${req.files['files'][0].filename}`;
    }
  
    // Insertar los datos en la base de datos
    connection.query(
      'INSERT INTO proyectos (titulo, autores, descripcionCorta, descripcionLarga, imagenPrincipal, imagenesAdicionales) VALUES (?, ?, ?, ?, ?, ?)',
      [titulo, autores, descripcion_corta, descripcion_larga, image, image2],
      (error, results) => {
        if (error) throw error;
        if (!error) {
          res.redirect('administracionProyectos');
        }
      }
    );
  });

  app.post('/eliminarpro', (req, res) => {

    const id = req.body.id;

    connection.query('DELETE FROM proyectos WHERE id=?',[id],
    (error,results)=>{
      if(error)throw error
      if(!error){
        res.redirect('administracionProyectos')
      }

    }
    
    )

  });


  app.post('/actualizarpro', (req, res) => {
    const id = req.body.id;
    const titulo = req.body.titulo;
    const autores = Array.isArray(req.body.autores) ? req.body.autores.join(', ') : req.body.autores;
    const descripcion_corta = req.body.descripcion_corta;
    const descripcion_larga = req.body.descripcion_larga;
    
  
    connection.query('UPDATE proyectos SET titulo=?, autores=?, descripcionCorta=?, descripcionLarga=? WHERE id=?',
      [titulo, autores, descripcion_corta, descripcion_larga, id], (error, results) => {
        if (error) throw error;
        if (!error) {
          res.redirect('administracionProyectos');
        }
      }
    );
  });


  app.post('/buscar', (req, res) => {
    const busqueda = req.body.searchInput;
  
    connection.query('SELECT * FROM estudiantes WHERE no_control = ?', [busqueda], (err, results) => {
      if (err) {
        console.error('Error al ejecutar la consulta:', err);
        res.send('<script>alert("Error al ejecutar la consulta"); window.history.back();</script>');
      } else {
        if (results.length === 0) {
          res.send('<script>alert("No se encontraron registros"); window.history.back();</script>');
        } else {
          res.render('detalle-alumno-nosesion', { results });
        }
      }
    });
  });

  app.post('/buscar2', (req, res) => {
    const busqueda = req.body.searchInput;
  
    connection.query('SELECT * FROM estudiantes WHERE no_control = ?', [busqueda], (err, results) => {
      if (err) {
        console.error('Error al ejecutar la consulta:', err);
        res.send('<script>alert("Error al ejecutar la consulta"); window.history.back();</script>');
      } else {
        if (results.length === 0) {
          res.send('<script>alert("No se encontraron registros"); window.history.back();</script>');
        } else {
          res.render('detalle-alumno', { results });
        }
      }
    });
  });