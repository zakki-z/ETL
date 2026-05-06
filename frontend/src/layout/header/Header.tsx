import { Link, useLocation } from 'react-router-dom';
import './Header.css';

function Header() {
    const location = useLocation();

    return (
        <header className="header">
            <div className="header-brand">
                <h1>Stroom</h1>
                <span className="header-subtitle">CFT → B2Bi Migration</span>
            </div>
            <nav className="header-nav">
                <Link
                    to="/"
                    className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
                >
                    Accueil
                </Link>
                <Link
                    to="/server-config"
                    className={location.pathname === '/server-config' ? 'nav-link active' : 'nav-link'}
                >
                    Config de serveur
                </Link>
                <Link
                    to="/database"
                    className={location.pathname === '/database' ? 'nav-link active' : 'nav-link'}
                >
                    base de données
                </Link>
            </nav>
        </header>
    );
}

export default Header;