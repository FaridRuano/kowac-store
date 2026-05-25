import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const metadata = {
  title: "Usuarios | Admin Kowac",
};

function formatDate(value) {
  if (!value) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function getUsers() {
  await connectDB();

  const users = await User.find({})
    .select("name email role isActive createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  }));
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="admin-page admin-users">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Configuración</span>
          <h1>Usuarios</h1>
          <p className="text-muted">
            Administra las cuentas que pueden acceder al sistema y a la experiencia de cliente.
          </p>
        </div>
        <span className="admin-page__count">{users.length} usuario(s)</span>
      </div>

      {users.length ? (
        <div className="admin-page__table-wrap">
          <table className="admin-page__table admin-users__table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="admin-page__primary-cell">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`admin-page__status ${user.isActive ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-page__empty">
          <strong>No hay usuarios registrados.</strong>
          <span>Cuando creemos cuentas nuevas aparecerán en esta sección.</span>
        </div>
      )}
    </div>
  );
}
