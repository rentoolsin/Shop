import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { Card } from "../../components/ui/Card";
import { ADMIN_MORE_ITEMS, AdminMoreLink } from "../../components/admin/more-items";

export function AdminMore() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div>
      <h1 className="mb-4 font-display text-[26px] font-extrabold text-ink dark:text-ink-inverted">More</h1>

      <Card className="mb-4 divide-y divide-graphite-100 overflow-hidden dark:divide-graphite-800">
        {ADMIN_MORE_ITEMS.map((item) => (
          <AdminMoreLink key={item.to} {...item} />
        ))}
      </Card>

      <Card className="p-4">
        <p className="truncate font-body text-[12px] text-graphite-500">Signed in as {session?.user.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-graphite-100 font-body text-[14px] font-medium text-state-danger dark:bg-graphite-800"
        >
          Sign out
        </button>
      </Card>
    </div>
  );
}
