require('dotenv').config()
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require ('body-parser');
const xlsx = require('xlsx');
const mysql = require('mysql');
const ejs = require('ejs');
const path = require('path');
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

//START
app.get('/buatsoal', (req, res) =>{
  res.render(__dirname+'/views/formbuatsoal.ejs')
}),

//UPLOAD FILE SOAL
app.get('/upload',(req,res)=>{
  res.render(__dirname+'/views/buatsoal.ejs')
});
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
      res.status(200).send('Berhasil melakukan pelabelan')
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
    res.render(__dirname+'/views/search.ejs',{data: resultTampil, searchLevel:'', searchMateri:''})
      });
    });


//GET DATA DENGAN KRITERIA
// app.get('/search',(req,res)=>{
//   // Mendapatkan kriteria pencarian dari body request
//   res.render(__dirname+'/views/search.ejs');
// });
  // Membuat query untuk pencarian dengan kriteria
app.get('/search',(req,res)=>{
  // const value1 = req.body.materi
  // const value2 = req.body.level
  const searchLevel = req.query.searchLevel || ''; //Ambil parameter pencarian
  const searchMateri = req.query.searchMateri || '';
  const query = `
    SELECT *
    FROM banksoal
    WHERE materi LIKE "%${searchMateri}%" AND tingkat_kesulitan LIKE "%${searchLevel}%"
  `;

  console.log('Search materi:', searchMateri);
  console.log('Search level:', searchLevel);
  console.log('Query:', query)

  // Menjalankan query dengan parameter kriteria
  dbBanksoal.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
    } 
    res.render(__dirname+'/views/search.ejs', {data: results, searchLevel, searchMateri});
  });
});

//Form Buat Ujian
app.get('/buatujian',(req,res)=>{
  res.render(__dirname+'/views/formbuatujian.ejs')
})
//Form Pilih opsi Manual dan Otomatis
app.get('/pilihopsi',(req,res)=>{
  res.render(__dirname+'/views/pilihopsi.ejs')
})
//Form Input Proporsi Soal
app.get('/proporsisoal',(req,res)=>{
  const getdistinc = `SELECT DISTINCT materi FROM banksoal`
  dbBanksoal.query(getdistinc, (error, results)=>{
    // Pastikan results telah didefinisikan dan merupakan array sebelum menggunakan map
    if (error) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
    }
  res.render(__dirname+'/views/generateotomatis.ejs', {uniqueValues: results})
});
});

app.post('/buatujian', (req,res)=> {
  const {namaUjian, tanggalUjian, waktuUjian, durasiUjian,BanyakSoal} = req.body;
  const saveujian =`
  INSERT INTO nama_ujian (nama_ujian, tanggal_ujian, waktu_ujian, durasi, banyak_soal) VALUES ('${namaUjian}', '${tanggalUjian}', '${waktuUjian}', ${durasiUjian}, ${BanyakSoal});`
  dbBanksoal.query(saveujian, [namaUjian, tanggalUjian, waktuUjian, durasiUjian,BanyakSoal], (err, results) =>{
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
    } 
    res.status(200).send('Nama Ujian berhasil disimpan')
  });
});


//GET DATA RANDOM
app.post('/generatedata',(req,res)=>{
  const namaUjian = req.body.namaUjian;
  const listMateri =[req.body.selectOption1, req.body.selectOption2, req.body.selectOption3, req.body.selectOption4, req.body.selectOption5, req.body.selectOption6, req.body.selectOption7];
  const listEasy = [req.body.easy1, req.body.easy2, req.body.easy3, req.body.easy4,req.body.easy5, req.body.easy6, req.body.easy7];
  const listHard = [req.body.hard1, req.body.hard2, req.body.hard3, req.body.hard4, req.body.hard5, req.body.hard6, req.body.hard7];
  const listDifficult = [req.body.difficult1, req.body.difficult2, req.body.difficult3, req.body.difficult4, req.body.difficult5, req.body.difficult6, req.body.difficult7]
      // SQL query untuk memasukkan data ke dalam tabel
      const newTabel = `CREATE TABLE ${namaUjian} (nomor INT AUTO_INCREMENT PRIMARY KEY, soal VARCHAR(1000), jawaban1 VARCHAR(1000), jawaban2 VARCHAR(1000), jawaban3 VARCHAR(1000), jawaban4 VARCHAR(1000), jawaban5 VARCHAR(1000), kunci_jawaban VARCHAR(1000));`
      dbBanksoal.query((newTabel), (err, resultTabel) => {
        //error handling
        if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }
        for (let i = 0; i<7; i++){
          const kriteriaMateri = listMateri[i];
          const kriteriaEasy = listEasy[i];
          const kriteriaHard = listHard[i];
          const kriteriaDifficult = listDifficult[i];

          const getEasy = `INSERT INTO ${namaUjian} (soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban) SELECT soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban FROM banksoal WHERE materi = '${kriteriaMateri}' AND tingkat_kesulitan = 'Easy' ORDER BY RAND() LIMIT ${kriteriaEasy}`
          const getHard = `INSERT INTO ${namaUjian} (soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban) SELECT soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban FROM banksoal WHERE materi = '${kriteriaMateri}' AND tingkat_kesulitan = 'Hard' ORDER BY RAND() LIMIT ${kriteriaHard}`
          const getDifficult = `INSERT INTO ${namaUjian} (soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban) SELECT soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban FROM banksoal WHERE materi = '${kriteriaMateri}' AND tingkat_kesulitan = 'Difficult' ORDER BY RAND() LIMIT ${kriteriaDifficult}`
          if (kriteriaMateri === undefined) {
            return res.status(400).json({ success: true, message: 'Soal ujian telah dibuat'});
          }
          
          dbBanksoal.query(getEasy, (err, resulteasy) => {
            // error handling
            if (err) {
              return res.status(500).json({ message: 'Ada kesalahan', error: err });
            }
          
            dbBanksoal.query(getHard, (err, resulthard) => {
              // error handling
              if (err) {
                return res.status(500).json({ message: 'Ada kesalahan', error: err });
              }
          
              dbBanksoal.query(getDifficult, (err, resultdifficult) => {
                // error handling
                if (err) {
                  return res.status(500).json({ message: 'Ada kesalahan', error: err });
                }
          
                res.status(200).json({ success: true, message: 'Soal ujian telah dibuat' });
              });
            });
          });
        };
      });
    });

//PILIH MANUAL
app.get('/pilihmanual', (req,res)=>{
  const pelabelanLevel = `UPDATE banksoal JOIN kko ON banksoal.soal LIKE CONCAT ('%', kko.teks_kko, '%') SET banksoal.tingkat_kesulitan= kko.tingkat_kesulitan`;
  const pelabelanMateri = `UPDATE banksoal JOIN keywordmateri ON banksoal.soal LIKE CONCAT ('%', keywordmateri.keyword, '%') SET banksoal.materi= keywordmateri.materi`;
  const menampilkanData = `SELECT * FROM banksoal`;
  console.log('Ini GET' );
  
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
      dbBanksoal.query((menampilkanData), (err, resultTampil) => {
        //error handling
        if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }
    // jika request berhasil
    res.render(__dirname+'/views/pilihmanual.ejs',{data: resultTampil});
      })
    });
  });
});
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
  const namaUjian = req.query.namaUjian || '';
    res.render(__dirname+'/views/tampilkansoal.ejs',{namaUjian})
  });
app.get('/tampilkansoal/:namaUjian', (req, res) => {
  const namaUjian = req.query.namaUjian || ''
  const menampilkanData = `SELECT * FROM ${namaUjian}`;
  console.log('Ini GET' );
  
  // jalankan query
      dbBanksoal.query((menampilkanData), (err, resultTampil) => {
        //error handling
        if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }
    // jika request berhasil
    res.render(__dirname+'/views/tampil.ejs',{data: resultTampil, namaUjian})
      });
    });

//CRUD
//CREATE DATA
app.get('/inputsoal', (req,res)=>{
  res.render(__dirname+'/views/inputsoal.ejs');
})
app.post('/inputsoal', (req, res) => {
  console.log('datanya', req.body);
  // buat variabel penampung data dan query sql
  const data = { ...req.body };
  const querySql = 'INSERT INTO banksoal SET ?';
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
app.get('/edit/:id', (req, res)=>{
  const id = req.params.id;
  // buat variabel penampung data dan query sql
  const data = { ...req.body };
  const querySearch = 'SELECT * FROM banksoal WHERE id = ?';
  dbBanksoal.query(querySearch, [id], (err, rows, field) => {
    // error handling
    if (err) {
        return res.status(500).json({ message: 'Ada kesalahan', error: err });
    }
  res.render(__dirname+'/views/update.ejs',{data: rows ,id: req.params.id});
});
});
app.post('/edit/:id', (req, res) => {
  const id = req.params.id;
  // buat variabel penampung data dan query sql
  const querySearch = `SELECT * FROM banksoal WHERE id = ?`;
  const { materi, tingkat_kesulitan, soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban } = req.body;
  const queryUpdate = 'UPDATE banksoal SET materi=?, tingkat_kesulitan=?, soal=?, jawaban1=?, jawaban2=?, jawaban3=?, jawaban4=?, jawaban5=?, kunci_jawaban=? WHERE id=?';
    // jalankan query update
    dbBanksoal.query(querySearch, [id], (err, rows, field) => {
      // error handling
      if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
      }
      dbBanksoal.query(queryUpdate, [materi, tingkat_kesulitan, soal, jawaban1, jawaban2, jawaban3, jawaban4, jawaban5, kunci_jawaban, id], (err, rows, field) => {
      // error handling
        if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }
      // jika update berhasil
      res.status(200).json({ success: true, message: 'Berhasil update data bank soal!' });
    });
  });
});

//DELETE DATA
app.get('/delete/:id', (req,res)=>{
  res.render(__dirname+'/views/delete.ejs');
})
app.post('/delete/:id', (req, res) => {
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
      // if (rows.length) {
          // jalankan query delete
          dbBanksoal.query(queryDelete, id, (err, rows, field) => {
              // error handling
              if (err) {
                  return res.status(500).json({ message: 'Ada kesalahan', error: err });
              }

              // jika delete berhasil
              res.status(200).json({ success: true, message: 'Berhasil hapus data!' });
          });
      // } else {
      //     return res.status(404).json({ message: 'Data tidak ditemukan!', success: false });
      });
  });
  


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});