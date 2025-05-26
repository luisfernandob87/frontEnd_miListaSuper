import React, { useState } from 'react';

const ImageUpload = () => {
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      let img = e.target.files[0];
      setImage(URL.createObjectURL(img));
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {image && (
        <div>
          <h2>Imagen cargada:</h2>
          <img src={image} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '300px' }} />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;