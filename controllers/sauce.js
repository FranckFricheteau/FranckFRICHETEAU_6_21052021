const Sauce = require('../models/sauce');
const fs = require('fs'); // file system de node.js

//créer une nouvelle sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: [],
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` //req.protocol: http ou https et req.get('host') ici localhost:3000
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrée!' }))
        .catch(error => res.status(400).json({ message: 'Une sauce a déjà été enregistrée sur cette adresse mail!' }));
};

//afficher toutes les sauces
exports.findSauces = (req, res, next) => {
    Sauce.find()
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(400).json({ error }));
};

//afficher une sauce en particulier
exports.findOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

//modifier une sauce existante
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? //opérateur ternaire
        //soit l'image est modifiée si une nouvelle est fournie soit modification du corps de la requête
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : {...req.body };
    //premier argument indique quelle sauce va être modifiée et le deuxième récupère les infos du body pour les attribuer au même id
    Sauce.updateOne({ _id: req.params.id }, {...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
        .catch(error => res.status(400).json({ error }));
};

//supprimer une sauce
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            //split du chemin de l'image pour récupérer le nom du fichier dans le dossier image
            const filename = sauce.imageUrl.split('/images/')[1];
            //supprimer le fichier ayant ce filename
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch(error => res.status(500).json({ error }));
};

//évaluer une sauce (like/dislike);
exports.evaluateSauce = (req, res, next) => {

    if (req.body.like === 0) { //si like de la sauce = 0
        Sauce.findOne({ _id: req.params.id })
            .then((sauce) => {
                if (sauce.usersLiked.find(user => user === req.body.userId)) { // Mise à jour du tableau like 
                    Sauce.updateOne({ _id: req.params.id }, {
                            $inc: { likes: -1 },
                            $pull: { usersLiked: req.body.userId }
                        })
                        .then(() => { res.status(201).json({ message: "Evaluation prise en compte!" }) })
                        .catch(error => {
                            res.status(400).json({ error })
                        });
                }
                if (sauce.usersDisliked.find(user => user === req.body.userId)) { // Mise à jour du tableau dislike
                    Sauce.updateOne({ _id: req.params.id }, {
                            $inc: { dislikes: -1 },
                            $pull: { usersDisliked: req.body.userId }
                        })
                        .then(() => { res.status(201).json({ message: "Evaluation prise en compte!" }) })
                        .catch(error => {
                            res.status(400).json({ error })
                        });
                }
            })
            .catch((error) => { res.status(400).json({ error }) });
    }

    if (req.body.like === 1) { //Mise à jour du nombre de like, like +1
        Sauce.updateOne({ _id: req.params.id }, {
                $inc: { likes: 1 },
                $push: { usersLiked: req.body.userId }
            })
            .then(() => { res.status(201).json({ message: "Evaluation prise en compte!" }) })
            .catch(error => {
                res.status(400).json({ error })
            });
    }

    if (req.body.like === -1) { //Mise à jour du nombre de like, like -1
        Sauce.updateOne({ _id: req.params.id }, {
                $inc: { dislikes: 1 },
                $push: { usersDisliked: req.body.userId }
            })
            .then(() => { res.status(201).json({ message: "Evaluation prise en compte!" }) })
            .catch(error => {
                res.status(400).json({ error })
            });
    }
}