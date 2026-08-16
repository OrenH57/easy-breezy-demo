import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import About from './pages/About';
import Admin from './pages/Admin';
import SeoPage from './pages/SeoPage';
import Results from './pages/Results';

const Public = ({ children }) => <Layout>{children}</Layout>;
export default function App() { return <Routes>
  <Route path="/" element={<Public><Home /></Public>} /><Route path="/services" element={<Public><Services /></Public>} /><Route path="/booking" element={<Public><Booking /></Public>} /><Route path="/about" element={<Public><About /></Public>} /><Route path="/before-after" element={<Public><Results /></Public>} /><Route path="/admin" element={<Admin />} />
  <Route path="/service-areas/:location" element={<Public><SeoPage location /></Public>} /><Route path="/:page" element={<Public><SeoPage /></Public>} /><Route path="*" element={<Navigate to="/" replace />} />
</Routes>; }
