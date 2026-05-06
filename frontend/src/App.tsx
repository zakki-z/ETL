import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/main/MainLayout';
import LandingPage from './pages/landingPage/LandingPage';
import ServerConfigPage from './pages/serverConfig/ServerConfigPage';
import DatabasePage from './pages/database/databasepage';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/server-config" element={<ServerConfigPage />} />
                    <Route path="/database" element={<DatabasePage />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}

export default App;