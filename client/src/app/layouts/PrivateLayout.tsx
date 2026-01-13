import { Outlet } from 'react-router-dom';

export const PrivateLayout = () => {
  return (
    <div>
      <h1>Authorized zone</h1>
      <Outlet />
    </div>
  );
};
