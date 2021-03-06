import {
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { fireStoreDB, auth, storage } from './firebase';

const getCurrentTimestamp = serverTimestamp();

const getJobRef = (jobId) => doc(fireStoreDB, 'users', auth.currentUser.uid, 'jobs', jobId);
const getMaterialRef = (jobId, materialId) =>
  doc(fireStoreDB, 'users', auth.currentUser.uid, 'jobs', jobId, 'materials', materialId);

const addUser = async (newuid, name = 'test name', company = 'test company') => {
  const newUserRef = doc(fireStoreDB, 'users', newuid);

  return await setDoc(newUserRef, { name, company, userId: newuid });
};

const getUser = async () => {
  const userRef = doc(fireStoreDB, 'users', auth.currentUser.uid);

  const userSnapshot = await getDoc(userRef);
  return userSnapshot.data();
};

const updateUser = async (data) => {
  const userRef = doc(fireStoreDB, 'users', auth.currentUser.uid);

  return await updateDoc(userRef, data);
};

const addJob = async (
  name = '',
  firstAddressLine = '',
  secondAddressLine = '',
  thirdAddressLine = '',
  city = '',
  postcode = '',
  estimate = 0,
  jobStartDate = '',
  jobEndDate = '',
  isLive = true,
  isComplete = false,
  jobNotes = ''
) => {
  // get current user file
  const userRef = collection(fireStoreDB, 'users', auth.currentUser.uid, 'jobs');

  return await addDoc(userRef, {
    name,
    firstAddressLine,
    secondAddressLine,
    thirdAddressLine,
    city,
    estimate,
    postcode,
    jobStartDate,
    jobEndDate,
    isLive,
    isComplete,
    jobNotes,
    createdAt: getCurrentTimestamp,
    uid: auth.currentUser.uid
  });
};
const getJobs = async () => {
  const userRef = doc(fireStoreDB, 'users', auth.currentUser.uid);

  const jobsSnapshot = await getDocs(collection(userRef, 'jobs'));
  const jobs = [];

  // iterates through snapshot and pushes job data
  jobsSnapshot.forEach((job) => {
    jobs.push({ id: job.id, ...job.data() });
  });

  return jobs;
};

const getJob = async (jobId) => {
  const jobRef = getJobRef(jobId);
  const jobSnapshot = await getDoc(jobRef);

  return jobSnapshot.data();
};

const updateJob = async (jobId, data) => {
  // function expects data argument to be an object
  const jobRef = getJobRef(jobId);
  return await updateDoc(jobRef, data);
};

const deleteJob = async (jobId) => {
  const jobRef = getJobRef(jobId);

  return await deleteDoc(jobRef);
};

const addMaterial = async (jobId, materialName = '', unit = 0, price = 0.0) => {
  // get current job file
  const jobRef = collection(fireStoreDB, 'users', auth.currentUser.uid, 'jobs', jobId, 'materials');

  return await addDoc(jobRef, { materialName, unit, price, jobId });
};

const getMaterials = async (jobId) => {
  const jobRef = getJobRef(jobId);
  const materialsSnapshot = await getDocs(collection(jobRef, 'materials'));
  const materials = [];

  // iterates through snapshot and pushes material data
  materialsSnapshot.forEach((material) => {
    materials.push({ id: material.id, ...material.data() });
  });

  return materials;
};

const getMaterial = async (jobId, materialId) => {
  const materialRef = getMaterialRef(jobId, materialId);
  const materialSnap = await getDoc(materialRef);

  return materialSnap.data();
};

const updateMaterial = async (jobId, materialId, data) => {
  // function expects data to be an object
  const materialRef = getMaterialRef(jobId, materialId);
  return await updateDoc(materialRef, data);
};

const deleteMaterial = async (jobId, materialId) => {
  // function expects data to be an object
  const materialRef = getMaterialRef(jobId, materialId);
  return await deleteDoc(materialRef);
};

const addImageFile = async (url, name, jobId) => {
  const imageRef = collection(fireStoreDB, 'users', auth.currentUser.uid, 'jobs', jobId, 'images');

  return await addDoc(imageRef, {
    url,
    name,
    createdAt: getCurrentTimestamp,
    uid: auth.currentUser.uid
  });
};

const uploadImage = (jobId, file) => {
  // This fixes bug where image was not always getting uploaded
  const userUid = auth.currentUser.uid;

  const filePath = `${userUid}/${jobId}/${file.name}`;
  const storageRef = ref(storage, `files/${filePath}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    'state_changed',
    () => {},
    (error) => error,
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        addImageFile(downloadURL, file.name, jobId);
      });
    }
  );
};

const getImages = async (jobId) => {
  const userUid = auth.currentUser.uid;
  const imagesSnapshot = await getDocs(
    collection(fireStoreDB, 'users', userUid, 'jobs', jobId, 'images')
  );
  const images = [];

  imagesSnapshot.forEach((image) => {
    images.push({ id: image.id, ...image.data() });
  });

  return images;
};

const deleteImage = async (jobId, imageName, imageId) => {
  // This fixes bug where image was not always getting deleted
  const userUid = auth.currentUser.uid;
  const imageRefFireStore = doc(fireStoreDB, 'users', userUid, 'jobs', jobId, 'images', imageId);
  const imageRefCloudStorage = ref(storage, `files/${userUid}/${jobId}/${imageName}`);
  try {
    // deletes from firestore
    await deleteDoc(imageRefFireStore);
    // deletes from storeage
    await deleteObject(imageRefCloudStorage);
  } catch (err) {
    return err;
  }
};

const databaseService = {
  addUser,
  getUser,
  updateUser,
  addJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  addMaterial,
  getMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  uploadImage,
  getImages,
  deleteImage
};

export default databaseService;
