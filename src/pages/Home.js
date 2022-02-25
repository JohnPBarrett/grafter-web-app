import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const Home = function () {
  const [error, setError] = useState('');
  const { logout, currentUser } = useAuth();

  const navigate = useNavigate();

  const handleLogout = async () => {
    setError('');

    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to log out');
    }
  };

  return (
    <div className="container">
      <h1>HI {currentUser && currentUser.email}</h1>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
      {error && <h1>{error}</h1>}
    </div>
  );
};

export default Home;
