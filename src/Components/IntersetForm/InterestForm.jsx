const response = await axios.patch(
  `https://uniisphere-backend-latest.onrender.com/api/users/profile`,
  {
    Interests: selectedInterests  // Only send the interests, userId comes from auth token
  },
  {
    headers: {
      'Authorization': tokenWithBearer,
      'Content-Type': 'application/json'
    },
  }
);

console.log("Interests update response:", response.data); 