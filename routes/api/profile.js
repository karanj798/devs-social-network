
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');
const router = express.Router();

router.get('/all', (req, res) => {
    const errors = {};
    Profile.find()
        .populate('user', ['name', 'avator'])
        .then(profiles => {
            if (!profiles) {
                errors.noprofile = 'There are no profiles';
                res.status(404).json(errors);
            }
            res.json(profiles);
        })
        .catch(err => res.status(404).json({profile: 'There is no profile for this user'}));
});

router.get('/handle/:handle', (req, res) => {
    const errors = {};
    Profile.findOne({ handle: req.params.handle })
        .populate('user', ['name', 'avator'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'There is no profile for this user';
                res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json(err));
});

router.get('/user/:user_id', (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.params.user_id })
        .populate('user', ['name', 'avator'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'There is no profile for this user';
                res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json({profile: 'There is no profile for this user'}));
});

router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    const error = {};
    Profile.findOne({ user: req.user.id })
        .populate('user', ['name', 'avator'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'There is no profile for this user';
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json(err));
});


router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername) profileFields.githubusername = req.body.githubusername;
    
    if (typeof req.body.skills != 'undefined') {
        profileFields.skills = req.body.skills.split(',');
    }

    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    mongoose.set('useFindAndModify', false);
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if (profile) {
                // update profile
                Profile.findOneAndUpdate(
                    { user: req.user.id }, 
                    { $set: profileFields }, 
                    { new: true}
                )
                .then(profile => res.json(profile));
            } else {
                // crate profile if the handle is not a duplicate
                // check if handle exists in mongodb alrady
                Profile.findOne({ handle: profileFields.handle }).then(profile => {
                    if (profile) {
                        errors.handle = 'That handle already exists';
                        res.status(400).json(errors);
                    }

                    new Profile(profileFields).save()
                        .then(profile => res.json(profile));
                });
            }
        })

});

router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);
    if(!isValid) {
        return res.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            const newExp = {
                title: req.body.title,
                company: req.body.company,
                location: req.body.location,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                description: req.body.description
            }
            
            // add new experience to array
            profile.experience.unshift(newExp);
            profile.save().then(profile => res.json(profile));
        })
});

router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);
    if(!isValid) {
        return res.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            const newEdu = {
                school: req.body.school,
                degree: req.body.degree,
                fieldofstudy: req.body.fieldofstudy,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                description: req.body.description
            }
            
            // add new experience to array
            profile.education.unshift(newEdu);
            profile.save().then(profile => res.json(profile));
        })
});


router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);
    
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            // Map the items to items.id and get the index for removing the profile
            const removeIndex = profile.experience
                .map(item => item.id)
                .indexOf(req.params.exp_id);

            // Splice out the array
            profile.experience.splice(removeIndex, 1);

            // Save 
            profile.save().then(profile => res.json(profile));
        })
        .catch(err => res.status(404).json(err));
});

router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);
    
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            // Map the items to items.id and get the index for removing the profile
            const removeIndex = profile.education
                .map(item => item.id)
                .indexOf(req.params.edu_id);

            // Splice out the array
            profile.education.splice(removeIndex, 1);

            // Save 
            profile.save().then(profile => res.json(profile));
        })
        .catch(err => res.status(404).json(err));
});


router.delete('/user/:user_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);
    
    Profile.findOneAndRemove({ user: req.user.id })
        .then(() => {
            User.findOneAndRemove({ _id: req.user.id })
                .then(() => res.json({ success: true }))
        }) 
        .catch(err => res.status(404).json(err));
});
module.exports = router;