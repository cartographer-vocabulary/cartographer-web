const functions = require("firebase-functions");
const admin = require('firebase-admin');


admin.initializeApp();
exports.getUidFromEmail = functions.https.onCall((data, context) => {
    if(context.auth){
        const email = data.email
        return admin.auth().getUserByEmail(email).then((userRecord)=>{ return {user: userRecord.uid}})
    }else{
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }
})

exports.getDisplayName = functions.https.onCall((data, context) => {
    if(context.auth){
        const uid = data.uid

        return admin.firestore().collection("users").doc(uid).get().then(doc=>{
            console.log(doc)
            return{name: doc.data().displayName}
        })
        // return {name:"test"}
    }else{
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }
})
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
