require('dotenv').config()
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require ('body-parser');
const xlsx = require('xlsx');
//const exceljs = require('exceljs');
const mysql = require('mysql');
//const mysql2 = require('mysql2/promise')
const ejs = require('ejs');
const path = require('path');
//const dbUjian = require('./database.js');
const dbBanksoal = require('./database.js');
const { error } = require('console');
const fs = require('fs')

const app = express();
const port = 3000;

//SET TEMPLATE ENGINE
app.set('view setEngine', 'ejs');

app.use(bodyParser.json()); // menguraikan data client
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname+'/public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.post('/upload-soal', upload.single('file'), (req, res) => {
  // Membaca file Excel
  const workbook = xlsx.read(req.file.buffer, {type: 'buffer'});
  const sheetName = workbook.SheetNames[0]; //diloop dijadikan 1 file aja
  const worksheet = workbook.Sheets[sheetName];
  // Mengonversi worksheet menjadi array objek
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Menyimpan data ke MySQL
    for (let i = 1; i<data.length; i++){
      const a = data[i][0]
      const b = data[i][1]
      const c = data[i][2]
      const d = data[i][3]
      const e = data[i][4]
      const f = data[i][5]
      const g = data[i][6]
      const query1 = `INSERT INTO banksoal (soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban) VALUES ('${a}','${b}','${c}','${d}','${e}','${f}','${g}')`
        dbBanksoal.query(query1, (err, result)=>{
          if (err) {
            return res.status(500).json({ message: 'Ada kesalahan', error: err });
          }
        })
      }
    res.status(200).json({message:'Data berhasil disimpan'});
});

//UPLOAD FILE KEYWORD MATERI
app.post('/upload-materi', upload.single('file'), (req, res) => {
  // Membaca file Excel
  const workbook = xlsx.read(req.file.buffer, {type: 'buffer'});
  const sheetName = workbook.SheetNames[0]; //diloop dijadikan 1 file aja
  const worksheet = workbook.Sheets[sheetName];
  // Mengonversi worksheet menjadi array objek
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  // Menyimpan data ke MySQL
  for (let i = 1; i<data.length; i++){
    const a = data[i][1]
    const b = data[i][0]
    const query2 = `INSERT INTO keywordmateri (keyword, materi) VALUES ('${b}','${a}')`
    dbBanksoal.query(query2, (err, result)=>{
      if (err) {
        return res.status(500).json({ message: 'Ada kesalahan', error: err });
      }
    })
  }
  res.status(200).json({message:'Data berhasil disimpan'})
});

//UPLOAD FILE KKO
// app.get('/upload-kko',(req,res)=>{
//   res.render(__dirname+'/views/uploadkko.ejs')
// });
app.post('/upload-kko', upload.single('file'), (req, res) => {
  // Membaca file Excel
  const workbook = xlsx.read(req.file.buffer, {type: 'buffer'});
  const sheetName = workbook.SheetNames[0]; 
  const worksheet = workbook.Sheets[sheetName];
  // Mengonversi worksheet menjadi array objek
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  // Menyimpan data ke MySQL
  for (let i = 1; i<data.length; i++){
    const a = data[i][1]
    const b = data[i][0]
    const query3 = `INSERT INTO kko (teks_kko, tingkat_kesulitan) VALUES ('${b}','${a}')`
    dbBanksoal.query(query3, (err, result)=>{
      if (err) {
        return res.status(500).json({ message: 'Ada kesalahan', error: err });
      }
    })
  }
  res.status(200).json({message:'Data berhasil disimpan'})
});

//MENAMPILKAN DATA
const itemsPerPage = 5; // Jumlah item per halaman
app.post('/pelabelan', (req, res)=>{
  const pelabelanLevel = `UPDATE banksoal JOIN kko ON banksoal.soal LIKE CONCAT ('%', kko.teks_kko, '%') SET banksoal.tingkat_kesulitan= kko.tingkat_kesulitan`;
  const pelabelanMateri = `UPDATE banksoal JOIN keywordmateri ON banksoal.soal LIKE CONCAT ('%', keywordmateri.keyword, '%') SET banksoal.materi= keywordmateri.materi`;
  
  // jalankan query
  dbBanksoal.query((pelabelanLevel), (err, resultLevel) => {
    //error handling
    if (err) {
      return res.status(500).json({ message: 'Ada kesalahan', error: err });
    }
    dbBanksoal.query((pelabelanMateri), (err, resultMateri) => {
      //error handling
      if (err) {
        return res.status(500).json({ message: 'Ada kesalahan', error: err });
      }
      res.status(200).json({message:'Berhasil melakukan pelabelan'})
    });
  });
});
app.get('/banksoal', (req, res) => {
  const menampilkanData = `SELECT * FROM banksoal`;
  console.log('Ini GET' );
      dbBanksoal.query((menampilkanData), (err, resultTampil) => {
        //error handling
        if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }
    // jika request berhasil
    res.status(200).json({success:true, resultTampil})
      });
    });


//GET DATA DENGAN KRITERIA
// app.get('/search',(req,res)=>{
//   // Mendapatkan kriteria pencarian dari body request
//   res.render(__dirname+'/views/search.ejs');
// });
  // Membuat query untuk pencarian dengan kriteria
app.get('/search',(req,res)=>{
  const searchLevel = req.body.searchLevel || ''; //Ambil parameter pencarian
  const searchMateri = req.body.searchMateri || '';
  const query = `
    SELECT *
    FROM banksoal
    WHERE materi LIKE "%${searchMateri}%" AND tingkat_kesulitan LIKE "%${searchLevel}%"
  `;

  console.log('Search materi:', searchMateri);
  console.log('Search level:', searchLevel);
  console.log('Query:', query)

  // Menjalankan query dengan parameter materi dan kesulitan soal
  dbBanksoal.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
    } 
    res.status(200).json({success:true, results})
  });
});

//BUAT UJIAN
// app.get('/buatujian',(req,res)=>{
//   res.render(__dirname+'/views/formbuatujian.ejs')
// })
// app.get('/pilihopsi',(req,res)=>{
//   res.render(__dirname+'/views/pilihopsi.ejs')
// })

// app.get('/proporsisoal',(req,res)=>{
//   const getdistinc = `SELECT DISTINCT materi FROM banksoal`
//   dbBanksoal.query(getdistinc, (error, results)=>{
//     // Pastikan results telah didefinisikan dan merupakan array sebelum menggunakan map
//     if (error) {
//       console.error('Error executing query:', err);
//       res.status(500).send('Internal Server Error');
//     }
//   res.render(__dirname+'/views/generateotomatis.ejs', {uniqueValues: results})
// })
app.post('/buatujian', (req, res) => {
  console.log('datanya', req.body);
  // buat variabel penampung data dan query sql
  const data = { ...req.body };
  const saveujian = `INSERT INTO nama_ujian SET ?`;
  console.log('datanya=', req.body);

  // jalankan query
  dbBanksoal.query(saveujian, data, (err,row,results) =>{
      // error handling
      if (err) {
          return res.status(500).json({ message: 'Gagal insert data!', error: err });
      }

      // jika request berhasil
      res.status(201).json({ success: true, message: 'Ujian berhasil dibuat!' });
  });
});


//GET DATA RANDOM
app.post('/generatedata',(req,res)=>{
  const namaUjian = req.body.namaUjian;
  const listMateri = req.body.listMateri;
  const listLevel = req.body.listLevel;
  const listJumlah = req.body.listJumlah;
  n = listMateri.length
      // SQL query untuk memasukkan data ke dalam tabel
      const newTabel = `CREATE TABLE ${namaUjian} (nomor INT AUTO_INCREMENT PRIMARY KEY, soal VARCHAR(1000), jawaban1 VARCHAR(1000), jawaban2 VARCHAR(1000), jawaban3 VARCHAR(1000), jawaban4 VARCHAR(1000), jawaban5 VARCHAR(1000), kunci_jawaban VARCHAR(1000));`
      dbBanksoal.query((newTabel), (err, resultTabel) => {
        //error handling
        if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }
        for (let i = 0; i<n; i++){
          const kriteriaMateri = listMateri[i];
          const kriteriaLevel = listLevel[i];
          const Jumlah = listJumlah[i];

          const getData = `INSERT INTO ${namaUjian} (soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban) SELECT soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban FROM banksoal WHERE materi = '${kriteriaMateri}' AND tingkat_kesulitan = '${kriteriaLevel}' ORDER BY RAND() LIMIT ${Jumlah}`;
          
          dbBanksoal.query(getData, (err, result) => {
            // error handling
            if (err) {
              return res.status(500).json({ message: 'Ada kesalahan', error: err });
            }
        
                res.status(200).json({ success: true, message: 'Soal ujian telah dibuat' });
              });
            }
          });
});

//PILIH MANUAL
app.post('/pilihmanual', (req,res)=>{
      // SQL query untuk memasukkan data ke dalam tabel
      const namaUjian = req.body.namaUjian
      const selectedItems = req.body.selectedItems
      if (selectedItems && selectedItems.length > 0) {
        // Buat tabel baru jika belum ada
        const createTableQuery = `CREATE TABLE ${namaUjian} (id INT AUTO_INCREMENT PRIMARY KEY, soal VARCHAR(1000), jawaban1 VARCHAR(1000), jawaban2 VARCHAR(1000), jawaban3 VARCHAR(1000), jawaban4 VARCHAR(1000), jawaban5 VARCHAR(1000), kunci_jawaban VARCHAR(1000))`;
        
        dbBanksoal.query(createTableQuery, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Ada kesalahan', error: err });
            }

            // Insert data terpilih ke tabel baru
            const insertQuery = `INSERT INTO ${namaUjian} (soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban) SELECT soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban FROM banksoal WHERE id IN (?)`;
            
            dbBanksoal.query(insertQuery, [selectedItems], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Ada kesalahan', error: err });
                }

                res.status(200).json({ success: true, message: 'Berhasil menyimpan data terpilih ke tabel baru.' });
            });
        });
    } else {
        res.status(400).json({ message: 'Tidak ada data terpilih untuk disimpan.' });
    }
});

//MENAMPILKAN SOAL
app.get('/tampilkansoal', (req, res) => {
  const namaUjian = req.body.namaUjian
  const menampilkanData = `SELECT * FROM ${namaUjian}`;
  console.log('Ini GET' );
  
  // jalankan query
      dbBanksoal.query((menampilkanData), (err, resultTampil) => {
        //error handling
        if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }
    // jika request berhasil
    res.status(200).json({resultTampil})
      });
    });

//CRUD
//CREATE DATA
app.post('/inputsoal', (req, res) => {
  console.log('datanya', req.body);
  // buat variabel penampung data dan query sql
  const data = { ...req.body };
  const querySql = `INSERT INTO banksoal SET ?`;
  console.log('coba create /input baru');
  console.log('datanya=', req.body);

  // jalankan query
  dbBanksoal.query(querySql, data, (err, rows, field) => {
      // error handling
      if (err) {
          return res.status(500).json({ message: 'Gagal insert data!', error: err });
      }

      // jika request berhasil
      res.status(201).json({ success: true, message: 'Berhasil insert data!' });
  });
});

//UPDATE DATA
app.put('/edit/:id', (req, res) => {
    // buat variabel penampung data dan query sql
    const data = { ...req.body };
    const querySearch = 'SELECT * FROM banksoal WHERE id = ?';
    const queryUpdate = 'UPDATE banksoal SET ? WHERE id = ?';

    // jalankan query untuk melakukan pencarian data
    dbBanksoal.query(querySearch, req.params.id, (err, rows, field) => {
        // error handling
        if (err) {
            return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }

        // jika id yang dimasukkan sesuai dengan data yang ada di db
        if (rows.length) {
            // jalankan query update
            dbBanksoal.query(queryUpdate, [data, req.params.id], (err, rows, field) => {
                // error handling
                if (err) {
                    return res.status(500).json({ message: 'Ada kesalahan', error: err });
                }

                // jika update berhasil
                res.status(200).json({ success: true, message: 'Berhasil update data bank soal!' });
            });
        } else {
            return res.status(404).json({ message: 'Soal tidak ditemukan!', success: false });
        }
    });
});
//DELETE DATA
app.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  // buat query sql untuk mencari data dan hapus
  const querySearch = 'SELECT * FROM banksoal WHERE id = ?';
  const queryDelete = 'DELETE FROM banksoal WHERE id = ?';

  // jalankan query untuk melakukan pencarian data
  dbBanksoal.query(querySearch, id, (err, rows, field) => {
      // error handling
      if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
      }

      // jika id yang dimasukkan sesuai dengan data yang ada di db
      if (rows.length) {
          // jalankan query delete
          dbBanksoal.query(queryDelete, id, (err, rows, field) => {
              // error handling
              if (err) {
                  return res.status(500).json({ message: 'Ada kesalahan', error: err });
              }

              // jika delete berhasil
              res.status(200).json({ success: true, message: 'Berhasil hapus data!' });
          });
      } else {
          return res.status(404).json({ message: 'Data tidak ditemukan!', success: false });
      };
    });
  });
  


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});