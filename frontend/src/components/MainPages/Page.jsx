import React, { useEffect } from 'react';
import {Routes , Route, useLocation} from 'react-router-dom';
import HomePage from './HomePage/HomePage';
import Dashboard from './Dashboard/Dashboard';

const Page = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Routes>
        <Route path = '/' element = {<HomePage/>}/>
        <Route path = '/dashboard' element = {<Dashboard/>}/>
    </Routes>
  )
}

export default Page;