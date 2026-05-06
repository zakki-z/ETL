import { ReactNode } from 'react';
import Header from '../header/Header';
import './MainLayout.css';

interface MainLayoutProps {
    children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="main-layout">
            <Header />
            <main className="main-content">{children}</main>
        </div>
    );
}

export default MainLayout;