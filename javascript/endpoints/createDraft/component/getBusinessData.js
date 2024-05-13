

async function getBusinessData(db, uid) {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    console.log('User doesnt exist');
  } else {
    const businessRef = db.collection('businesses').doc(userDoc.data().businessID);
    const businessDoc = await businessRef.get();
    if (!businessDoc.exists) {
      console.log('User doesnt exist');
    } else {
      return {
        businessID: userDoc.data().businessID,
        lastUsedFacebookAdAccount: userDoc.data().lastUsedFacebookAdAccount,
        lastUsedFacebookPixel: userDoc.data().lastUsedFacebookPixel,
        lastUsedFacebookPage: userDoc.data().lastUsedFacebookPage,
        facebookAccessToken: businessDoc.data().facebookAccessToken,
      }
    } 
  } 
}

module.exports = getBusinessData;