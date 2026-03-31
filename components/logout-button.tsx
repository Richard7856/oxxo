import { logout } from '@/app/login/actions';

export default function LogoutButton() {
    return (
        <form action={logout}>
            <button
                type="submit"
                className="bg-[#1D6B2A] hover:bg-[#155120] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                Cerrar Sesión
            </button>
        </form>
    );
}
