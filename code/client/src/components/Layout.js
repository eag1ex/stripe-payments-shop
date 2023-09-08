import { Outlet } from 'react-router-dom';

 const Layout = (props) => {
  return (
    <>

      <Outlet {...props} />
    </>
  );
};

export default Layout;