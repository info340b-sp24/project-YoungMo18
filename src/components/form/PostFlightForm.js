import React, { useState } from "react";
import { getDatabase, ref, get, set as firebaseSet } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export function PostFlightForm() {
  const [flightID, setFlightID] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [quantity, setQuantity] = useState(-1);
  const [images, setImages] = useState([]);
  const [flightExist, setFlightExist] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [incompatibleFile, setIncompatibleFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successPost, setSuccessPost] = useState(false);
  const allowedFileTypes = ["image/png", "image/jpeg", "image/jpg"];
  let imageUrls = [];

  const handleflightIDChange = (event) => {
    setFlightID(event.target.value);
  };

  const handleFromChange = (event) => {
    setFrom(event.target.value);
  };

  const handleToChange = (event) => {
    setTo(event.target.value);
  };

  const handleDepartureTimeChange = (event) => {
    setDepartureTime(event.target.value);
  };

  const handleArrivalTimeChange = (event) => {
    setArrivalTime(event.target.value);
  };

  const handleQuantityChange = (event) => {
    setQuantity(event.target.value);
  };

  const handleDepartureDateChange = (event) => {
    setDepartureDate(String(event.target.value));
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setImages(selectedFiles);
  };

  const checkEmpty = () =>
    flightID === "" ||
    from === "" ||
    to === "" ||
    departureTime === "" ||
    arrivalTime === "" ||
    departureDate === "" ||
    images.length === 0 ||
    quantity === -1;

  const checkFile = () => {
    return images.every((image) => allowedFileTypes.includes(image.type));
  };

  const checkFlightEntries = () => {
    const db = getDatabase();
    const flightRef = ref(db, `flight/${flightID}`);

    return get(flightRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          setFlightExist(true);
          return true;
        } else {
          setFlightExist(false);
          return false;
        }
      })
      .catch((error) => {
        console.error(error);
        return false;
      });
  };

  const inputDBEntries = () => {
    const db = getDatabase();
    const flightRef = ref(db, `flight/${flightID}`);
    firebaseSet(flightRef, {
      flightID: flightID,
      from: from,
      to: to,
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      quantity: quantity,
      departureDate: departureDate,
      images: imageUrls,
    })
      .then(() => console.log("data saved successfully!"))
      .catch((err) => console.log(err));
    setSuccessPost(true);
  };

  const inputStorageEntries = async () => {
    const storage = getStorage();

    try {
      for (const image of images) {
        const fileRef = storageRef(storage, `img/${image.name}`);
        await uploadBytes(fileRef, image);
        const url = await getDownloadURL(fileRef);
        imageUrls.push(url);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let empty = checkEmpty();
    if (!empty) {
      setIsEmpty(false);
      let checkImage = checkFile();
      if (checkImage) {
        setIncompatibleFile(false);
        try {
          let checkFlightExist = await checkFlightEntries();
          if (!checkFlightExist) {
            setLoading(true);
            await inputStorageEntries();
            await inputDBEntries();
            setLoading(false);
            setTimeout(() => {
              window.location.reload();
            }, 1800);
          } else {
            console.log("Flight ID already exists!");
          }
        } catch (err) {
          console.log(err);
        }
      } else {
        setIncompatibleFile(true);
        console.log("incompatible file");
      }
    } else {
      setIsEmpty(true);
    }
  };

  return (
    <>
      <section class="post-container">
        <h1>Post Flights</h1>
        <form id="post-flights-form">
          <label for="flight_id">Flight ID:</label>
          <input
            type="text"
            id="flight_id"
            name="flight_id"
            onChange={handleflightIDChange}
            required
          />
          <label for="from">From:</label>
          <input
            type="text"
            id="from"
            name="from"
            onChange={handleFromChange}
            required
          />
          <label for="to">To:</label>
          <input
            type="text"
            id="to"
            name="to"
            onChange={handleToChange}
            required
          />
          <label for="departure_time">Departure Time:</label>
          <input
            type="text"
            id="departure_time"
            name="departure_time"
            onChange={handleDepartureTimeChange}
            required
          />
          <label for="arrival_time">Arrival Time:</label>
          <input
            type="text"
            id="arrival_time"
            name="arrival_time"
            onChange={handleArrivalTimeChange}
            required
          />
          <label for="departure_date">Departure Date:</label>
          <input
            type="date"
            id="departure_date"
            name="departure_date"
            onChange={handleDepartureDateChange}
            required
          />
          <label for="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            onChange={handleQuantityChange}
            required
          />
          <label for="images">Images:</label>
          <div className="img-input-container">
            <input
              type="file"
              id="images"
              name="images"
              multiple
              onChange={handleImageChange}
              required
            />
          </div>
          <button type="submit" onClick={handleSubmit}>
            Post Flights
          </button>
        </form>
        {isEmpty && <div className="error-msg">Form is incomplete</div>}
        {flightExist && (
          <div className="error-msg">Flight ID already exists</div>
        )}
        {incompatibleFile && (
          <div className="error-msg">Incompatible file. Input an image</div>
        )}
        {loading && (
          <div>Loading...</div>
        )}
        {successPost && (
          <div className="success-msg">Successfully posted!!!</div>
        )}
      </section>
    </>
  );
}
