const mysql = require('mysql');

const dbBanksoal = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bank_soal',
    multipleStatements: true,
  });
  // koneksi database
dbBanksoal.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});


module.exports = dbBanksoal;
// module.exports = dbUjian;