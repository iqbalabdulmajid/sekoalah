const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "geprekerspedas@gmail.com",
    pass: "dpkb axqi vols oohq", // App password
  },
});

const mailOptions = {
  from: '"Tes Sistem" <geprekerspedas@gmail.com>',
  to: "iqbalabdulmajid02@gmail.com",
  subject: "Tes Kirim Email",
  text: "Ini adalah tes kirim email dari Node.js",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error("Gagal kirim:", error);
  }
  console.log("Email berhasil dikirim:", info.response);
});
