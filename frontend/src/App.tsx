import React, { useState, useEffect } from 'react';
import './App.css';

import axios from 'axios';
import { Carousel } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const baseUri: string = process.env.REACT_APP_API_URL!;
console.log(baseUri);

function App() {
  const [allPhotos, setAllPhotos] = useState([]);
  useEffect(() => {
    (async function getPhotos() {
      const { data } = await axios.get(`${baseUri}getAllPhotos`);
      setAllPhotos(data);
    })();
  }, []);

  function getCarouselImage(photo: any) {
    return (
      <Carousel.Item interval={1000} key={photo.url} style={{ height: 350 }}>
        <img src={photo.url} alt={photo.filename} className='h-100' />
        <Carousel.Caption>
          <h3 style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            {photo.filename}
          </h3>
        </Carousel.Caption>
      </Carousel.Item>
    );
  }

  console.log(allPhotos);
  return (
    <div className='App bg-secondary min-vh-100'>
      <h1 className='display-3 p-3 mb-5'>Super Mario and friends</h1>
      <Carousel>{allPhotos.map(photo => getCarouselImage(photo))}</Carousel>
    </div>
  );
}

export default App;
