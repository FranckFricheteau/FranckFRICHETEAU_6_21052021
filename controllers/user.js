const User = require('../models/user');

const jwt = require('jsonwebtoken'); //Il permet l'échange sécurisé de jetons (tokens) entre plusieurs parties

const bcrypt = require('bcrypt'); // fonction de hachage de mot de passe


//pour enregistrer des nouveaux utilisateurs
exports.signup = (req, res, next) => {

    bcrypt.hash(req.body.password, 10) // Hachage du mot passe avec 10 tours d'algorithmes de hachage
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' })) // Création utilisateur, requête réussie et ressource créée code 201 OK
                .catch(error => res.status(400).send('Utilisateur déjà existant !')); // Erreur 400 Utilisateur déjà existant
        })
        .catch(error => res.status(500).json({ error: 'le serveur a rencontré un problème inattendu empêchant de répondre à la requête' })); // erreur serveur code 500
};

//Connexion des utilisateurs existants
exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(400).send('Adresse mail inexistante !'); //Erreur adresse mail introuvable code 400
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(400).send('Mot de passe incorrect !'); //Erreur mot de passe invalide code 400
                    }
                    res.status(200).json({ // l'user est bien connecté code 200 OK
                        userId: user._id,
                        token: jwt.sign({ userId: user._id },
                            //clé secrète pour l'encodage 
                            'RANDOM_TOKEN_SECRET',
                            //chaque token durera 24 h
                            { expiresIn: '24h' }
                        )
                    });
                })
                //si problème de connexion à mongodb
                .catch(error => res.status(500).json({ error: 'le serveur a rencontré un problème inattendu empêchant de répondre à la requête' }));
        })

};