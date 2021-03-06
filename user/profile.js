/**
 * profile file, user's profile functionalities
 */
module.exports = function (app) {

    var utility = require('./../utility');
    var upload = utility.upload;
    var connection = utility.connection;
    var path = require('path');
    var fs = require('fs');
    var nodemailer = require('nodemailer');
    var schedule = require('node-schedule');

    /**
    * Parses the text from the article and returns the summarized text
    * @param: req = {email, prefersEmailUpdates}
    * @return: res = {success, error?}
    */
    app.post('/preferEmailUpdates', function (req, res) {
        try {
            var user = JSON.parse(req.body);
        } catch (error) {
            res.status(500).send({ success: false, error: error });
            return;
        }
        var email = user.email;
        var emails = user.prefersEmailUpdates;

        connection.query("UPDATE users SET prefersEmailUpdates = ? WHERE email = ?", [emails, email], function (err, result) {
            if (err) {
                console.log(err);
                res.status(500).send({ success: false, error: "This user doesn't exist." });
            } else {
                console.log('no error');
                res.status(200).send({ success: true, error: null });
            }
        });
    });

    app.post('/profile', function (req, res) {

        //fetch the user by email and return it in json
        try {
            var user = JSON.parse(req.body);
        } catch (error) {
            res.status(500).send({ success: false, error: error });
        }
        var email = user.email;
        //console.log('req.body', JSON.parse(req.body));
        connection.query("SELECT * FROM users WHERE email = ?", [email], function (err, result) {
            if (result.length == 0) {
                res.status(500).send({ success: false, error: "This email address doesn't exist." });

            } else if (result.length == 1) {
                var data = {
                    success: true,
                    name: result[0].name,
                    email: result[0].email,
                    prefersEmailUpdates: result[0].prefersEmailUpdates,
                    postCount: result[0].postCount
                }

                res.send(data)

            } else {
                //more than one user?
                //console.log("More than one user found...");
            }
        });
    });

    app.post('/editProfile', function (req, res) {
        //update name
        //update email
        try {
            var user = JSON.parse(req.body);
        } catch (error) {
            res.status(500).send({ success: false, error: err });
        }
        var email = user.email;

        if (user.newEmail != null) {
            //update email
            //console.log("Update email");
            //  'UPDATE employees SET location = ? Where ID = ?',

            connection.query("UPDATE users SET email = ? WHERE email = ?", [user.newEmail, user.email], function (err, result) {
                if (err) {
                    res.status(500).send({ success: false, error: err })
                }
            });

        } else {
            //console.log("email not updated");
        }

        if (user.newName != null) {
            //update name
            //console.log("Update name");
            connection.query("UPDATE users SET name = ? WHERE email = ?", [user.newName, user.email], function (err, result) {
                if (err) {
                    res.status(500).send({ success: false, error: err })

                }
            });

        } else {
            //console.log("name not updated");

        }

        res.status(200).send({ success: true })


    });

    /**
     * Upload profile picture using multer
     * File input field name is simply 'file'
     * get the uploaded photo and saves it on the server
     * Add the filepath on to db 
     * @Header: multipart/form-data
     * @req: req.file : image
     *       req.body.email: email
     * @res: @res:{success: true} 
     *       err
     */
    app.post('/addpicture', upload.single('file'), function (req, res) {
        //console.log("req:", req);
        // console.log("reqfile:", req.file);
        // console.log("filname: ",req.file.filename);
        // console.log("originalname: ",req.file.originalname);
        console.log("path:", req.file.path);
        // console.log("type:", req.file.mimetype);
        console.log("email:", req.body);
        /*try {
          console.log("here12");
          var body = JSON.parse(req.body);
        } catch (err) {
          console.log("here11");
          res.status(500).send({ success: false, error: err });
        }*/
        var userEmail = req.body.email;
        var picturePath = 'uploads/' + req.file.filename;
        console.log("pic", picturePath)
        console.log("email:", userEmail);
        console.log("dirname: ", __dirname);
        console.log("filename: ", req.file.filename)
        if (!req.file) {
            console.log("File has not been received");
            res.status(500).send({ success: false, error: "File has not been received" });
        }
        else {
            const { exec } = require('child_process');
            exec('ls ./uploads', (err, stdout, stderr) => {
                if (err) {
                    // node couldn't execute the command
                    return;
                }

                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                var str = stdout + " " + picturePath;
                connection.query('UPDATE users SET picturePath = ? WHERE email = ?', [picturePath, userEmail], function (err, result) {
                    console.log("inside insert");
                    if (err) {
                        res.status(500).send({ success: false, error: err });
                    } else {
                        res.status(200).send({ success: true });
                    }
                });
            });

            console.log("here2");
            //store path in sql
            // connection.query('UPDATE users SET picturePath = ? WHERE email = ?', [picturePath, userEmail], function (err, result) {
            //     console.log("inside insert");
            //     if (err) {
            //         res.status(500).send({ success: false, error: err });
            //     } else {
            //         res.status(200).send({ success: true });
            //     }
            // });
        }
    });

    /**
 * Gets the path of the user's picture stored in the db
 * @req:{'email': ''}
 * @res:{success: true} 
 *       err
 **/
    app.post('/getpicture', function (req, res) {
        try {
            var body = JSON.parse(req.body);
        } catch (err) {
            //console.log("here1:", err);
            res.status(500).send({ success: false, error: err });
        }
        //console.log("body", body);
        var userEmail = body.email;
        //console.log("email", userEmail);
        //query db for picturepath
        connection.query("SELECT * FROM users WHERE email = ?", [userEmail], function (err, result) {
            //console.log("gets here1");
            //console.log("result:", result);
            if (err) {
                //console.log("here3:", err);
                res.status(500).send({ success: false, error: err });
            }
            else {
                //console.log("Obtained userId from user email");
                var picturePath = result[0].picturePath;
                //console.log("result:", result[0]);
                try {
                    //console.log("absolute path: ", path.resolve(picturePath));
                    res.download(path.resolve(picturePath));
                } catch (err) {
                    //console.log("here4:", err);
                    res.status(500).send({ success: false, error: err });
                }
            }
        });
    });


    /**Add collaborators to users
     * The user wants to add a collaborator so they select a note and enter the email address
     * of the collaborator that you want to share the note with
     * We recive the userEmail: the email of the current user, noteID: the note id of the current
     * user that they want to share with collaborator user, colabEmail: the email of the collaborator 
     * that will obtain editing abilities 
     * @req:{'noteID':'','userEmail':'', 'colabEmail':''} 
     * @res:{success: true} 
     *       err
     */
    app.post('/addcollaborators', function (req, res) {
        try {
            var body = JSON.parse(req.body);
        } catch (error) {
            res.status(500).send({ success: false, error: error });
        }
        var noteID = body.noteID;
        var userEmail = body.userEmail;
        var colabEmail = body.colabEmail;
        //console.log("noteId:", noteID);
        console.log("useremail:", userEmail);
        console.log("colabemail:", colabEmail);

        var userID;
        var userIdColab;

        //get the userID from userEmail
        connection.query("SELECT * FROM users WHERE email IN ('" + userEmail + "', '" + colabEmail + "')", function (err, result) {
            if (err) {
                res.status(500).send({ success: false, error: err });
            }
            else {
                if (result[0] == null || result[1] == null) {
                    var message = "Incorrect userEmail or colabEmail"
                    res.status(500).send(message);
                }
                //console.log("Obtained userId from user email");
                console.log("result:", result);
                if (result[1].email == userEmail) {
                    userID = result[1].idUser;
                    userIdColab = result[0].idUser;
                }
                else {
                    userID = result[0].idUser;
                    userIdColab = result[1].idUser;
                }
                console.log("userId:", userID);
                console.log("userIdColab:", userIdColab);
                var collaborator = {
                    noteID: noteID,
                    userID: userID,
                    userIdColab: userIdColab
                };
                //console.log("collaborator: ", collaborator);
                connection.query("INSERT INTO collaborators SET ?", [collaborator], function (err, result) {
                    //console.log("goes in here");
                    if (err) {
                        res.status(500).send({ success: false, error: err });
                    }
                    else {
                        //console.log("created row in the collaborator table");
                        res.status(200).send({ success: true });
                    }
                });
            }
        });
    });

    /**
    * get list of collaborators for the user's note
    * @req:{'userEmail':'','noteId':''} 
    * @res:[{'colabEmail':'', 'name':''}] 
    *       err
    **/
    app.post('/getcollaborators', function (req, res) {
        try {
            var body = JSON.parse(req.body);
        } catch (error) {
            res.status(500).send({ success: false, error: error });
        }
        var userEmail = body.userEmail;
        var noteID = body.noteID;
        //get the userID from userEmail
        connection.query("SELECT * FROM users WHERE email = ?", [userEmail], function (err, result) {
            if (err) {
                //var message = "Incorrect email address";
                res.status(500).send({ success: false, error: err });
            }
            else {
                //console.log("Obtained userId from user email");
                console.log("result:", result);
                if (result[0] == null) {
                    var message = "Incorrect email address";
                    res.status(500).send(message);
                }
                userID = result[0].idUser;

                console.log("userId:", userID);
                //console.log("collaborator: ", collaborator);
                //get the user's collaborators ids
                connection.query("SELECT * FROM collaborators WHERE userID = ? AND noteID = ?", [userID, noteID], function (err, result) {
                    //console.log("goes in here");
                    if (err) {
                        // var message = "Incorrect noteID";
                        res.status(500).send({ success: false, error: err });
                    }
                    else {
                        //console.log("created row in the collaborator table");
                        //add all notes and their name to an array 
                        /*if (result[0] == null) {
                            var message = "Incorrect noteID";
                            res.status(500).send(message);
                        }*/
                        var array = [];
                        var userIdColabList = [];
                        //console.log(result.length);
                        for (var i = 0; i < result.length; i++) {
                            userIdColabList.push(result[i].userIdColab);
                            //console.log("colabId:", userIdColab);
                            // console.log("goes here1");
                        }
                        var userIdString = "SELECT * FROM users WHERE idUser = ?"
                        for (var i = 1; i < userIdColabList.length; i++) {
                            userIdString += " OR idUser = ?"
                        }
                        //console.log(userIdString);
                        connection.query(userIdString, userIdColabList, function (err, result) {
                            //console.log("goes here");
                            if (err) {
                                //console.log("goes on here");
                                res.status(500).send({ success: false, error: err });
                            }
                            else {
                                //console.log("comes here");
                                for (var i = 0; i < result.length; i++) {

                                    var colabEmail = result[i].email;
                                    var name = result[i].name;
                                    //console.log("colabEmail:", colabEmail);
                                    //console.log("name:", name);
                                    var collaborator = {
                                        colabEmail: colabEmail,
                                        name: name
                                    }
                                    //console.log("collaborators:", collaborator);
                                    array.push(collaborator);
                                    //console.log(array);
                                }
                                //send back an array of the collaborator that contains colabEmail and name
                                //console.log("array", array);
                                res.status(200);
                                res.send(array);
                            }
                        });
                    }
                });
            }
        });

    });


    /**
    * delete collaborators 
    * @req:{'colabEmail':'','userEmail': '', noteId':''} 
    * @res:{success: true}
    *       err
    **/
    app.post('/deletecollaborators', function (req, res) {
        try {
            var body = JSON.parse(req.body);
        } catch (error) {
            res.status(500).send({ success: false, error: error });
        }
        var colabEmail = body.colabEmail;
        var userEmail = body.userEmail;
        var noteID = body.noteID;
        //get the userID from userEmail
        connection.query("SELECT * FROM users WHERE email IN ('" + userEmail + "', '" + colabEmail + "')", function (err, result) {
            if (err) {
                res.status(500).send({ success: false, error: err });
            }
            else {
                if (result[0] == null || result[1] == null) {
                    var message = "Incorrect userEmail or colabEmail"
                    res.status(500).send(message);
                }
                //console.log("Obtained userId from user email");
                console.log("result:", result);
                if (result[1].email == userEmail) {
                    userID = result[1].idUser;
                    userIdColab = result[0].idUser;
                }
                else {
                    userID = result[0].idUser;
                    userIdColab = result[1].idUser;
                }
                console.log("colabId:", userIdColab);
                connection.query("DELETE FROM collaborators WHERE userIdColab = ? AND userID = ? AND noteID = ?", [userIdColab, userID, noteID], function (err, result) {
                    if (err) {
                        res.status(500).send({ success: false, error: err });
                    }
                    else {
                        console.log("result:", result);
                        res.status(200).send({ success: true });
                    }
                });
            }
        });
    });

    /**
    * user can add feedback 
    * @req:{'email':'', 'feedback' : ''} 
    * @res:{success: true}
    *       err
    **/
    app.post('/addfeedback', function (req, res) {
        try {
            var body = JSON.parse(req.body);
            var userEmail = body.email;
            var feedback = body.feedback;
        } catch (error) {
            res.status(500).send({ success: false, error: error });
        }

        //get the userID from userEmail
        connection.query("SELECT * FROM users WHERE email = ?", [userEmail], function (err, result) {
            if (err) {
                res.status(500).send({ success: false, error: err });
            }
            else {
                var userID = result[0].idUser;
                //add feedback to user table
                connection.query("UPDATE users SET feedback = ? WHERE idUser = ?", [feedback, userID], function (err, result) {
                    if (err) {
                        res.status(500).send({ success: false, error: err });
                    }
                    else {
                        res.status(200).send({ success: true });
                    }
                });
            }
        });
    });


    /**
    * as a developer would like to view all feedback
    * @req:{} 
    * @res:[{"userID": "", "name": "", "feedback": ""}]
    *       err
    **/
    app.post('/viewfeedback', function (req, res) {
        /*try {
            var body = JSON.parse(req.body);
        } catch (error) {
            res.status(500).send({ success: false, error: error });
        }*/

        //get the whole table of users
        connection.query("SELECT * FROM users", function (err, result) {
            if (err) {
                res.status(500).send({ success: false, error: err });
            }
            else {
                var array = [];
                for (var i = 0; i < result.length; i++) {
                    var userID = result[i].idUser;
                    var name = result[i].name;
                    var feedback = result[i].feedback;
                    var developFeed =
                        {
                            userID: userID,
                            name: name,
                            feedback: feedback
                        }
                    array.push(developFeed);
                }
                res.status(200);
                res.send(array);
            }
        });
    });

    /**this endpoint will send an email to the email passed in using the mailer. The email will contain a reminder message.
    ** @req: {
                "email": "",
                "dateString": 'DD/MM/YYYY HH:mm:ss',
                "message": ""
              }
    ** @res: {success: true} 
    **       err
    **/
    app.post('/emailReminder', function (req, res, next) {
        //use mailer to send email to the email address passed in.
        ////console.log(req);
        // //console.log(JSON.parse(req.body));
        try {
            var user = JSON.parse(req.body);
            //var dateString = user.dateString;
            var message = user.message;
            var date = user.dateString;
        } catch (error) {
            res.status(500).send({ success: false, error: error });
        }
        var email = user.email;
        var transporter = nodemailer.createTransport({
            service: 'GMAIL',
            auth: {
                user: 'simplif.ai17@gmail.com',
                pass: 'simplif.ai2017'
            }
        });
        var mess;
        if (date != null) {
            mess = '<p>' + message + '</p>' + '<p>' + 'Date reminder: ' + date + '</p>';
        }
        else {
            //console.log("goes in here");
            mess = '<p>' + message + '</p>';
        }
        //console.log("mess: " + mess);
        //console.log(transporter);
        var mailOptions = {
            from: 'simplif.ai17@gmail.com',
            to: email,
            subject: 'Reminder from Simplif.ai',
            text: message,
            html: mess
        }
        //date.format(now, dateString);
        //console.log(mailOptions.html);
        transporter.sendMail(mailOptions, function (error, info) {
            //console.log(error);
            //console.log(info);
            if (error) {
                //console.log('error sending email for resetting password');
                res.status(500).send({ success: false, error: error });
            }
            else {
                //console.log('Email sent: ' + req.param.url);
                res.status(200).send({ success: true });
            }
            nodemailer.getTestMessageUrl(info);
            transporter.close();
        });
    });
}

