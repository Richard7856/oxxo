import { logout } from '@/app/login/actions';

export default function LogoutButton() {
    return (
        <form action={logout}>
            <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                Cerrar Sesión
            </button>
        </form>
    );
}
