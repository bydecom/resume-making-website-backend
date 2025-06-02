const mongoose = require('mongoose');

const cvSnapshotSchema = new mongoose.Schema({
  name: String,
  template: {
    id: String,
    name: String
  },
  personalInfo: {
    firstName: String,
    lastName: String,
    professionalHeadline: String,
    email: String,
    phone: String,
    location: String,
    country: String,
    website: String,
    linkedin: String
  },
  summary: String,
  education: [{
    degree: String,
    school: String,
    startDate: String,
    endDate: String,
    description: String,
    isPresent: Boolean
  }],
  experience: [{
    title: String,
    company: String,
    startDate: String,
    endDate: String,
    description: String,
    isPresent: Boolean
  }],
  skills: [String],
  projects: [{
    title: String,
    role: String,
    startDate: String,
    endDate: String,
    description: String,
    url: String,
    isPresent: Boolean
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: String,
    url: String
  }],
  languages: [{
    language: String,
    proficiency: String
  }],
  additionalInfo: {
    interests: String,
    achievements: String,
    publications: String,
    references: String
  },
  customFields: [{
    label: String,
    value: String
  }]
}, { _id: false }); // Do not create _id for each snapshot

module.exports = cvSnapshotSchema; 