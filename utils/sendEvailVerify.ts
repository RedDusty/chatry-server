import nodemailer from "nodemailer";
import "dotenv/config";
import Mail from "nodemailer/lib/mailer";

const sendEmailVerify = (email: string, link: string) => {
  const tranporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.BOT_EMAIL,
      pass: process.env.BOT_PASSWORD,
    },
  });

  const emailHTML = `<div style="text-align: center;"><font size="6" color="#0000ff"><b>Chatry</b></font></div><div style="text-align: left;"><font size="4">Account activation&nbsp;on the site -&nbsp;</font><a href="https://chatry.vercel.app/"><font size="4">https://chatry.vercel.app/</font></a></div><div style="text-align: left;"><font size="4">Link for account activation:</font></div><div style="text-align: left;"><u><font color="#0000ff"><a href="${link}" target="_blank">${link}</a></font></u><br></div><br><div style="text-align: left;"><font size="4">If you have not registered on this site, please ignore this link.</font></div>`;

  const mailOptions: Mail.Options = {
    from: "chatrybot@gmail.com",
    to: email,
    subject: "[noreply] Chatry account verification.",
    html: emailHTML,
  };

  tranporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

export default sendEmailVerify;
