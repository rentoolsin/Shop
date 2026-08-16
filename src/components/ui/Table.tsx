import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

/**
 * Dense desktop table shell for admin list pages. Pair with a `md:hidden`
 * card list for the mobile view of the same data — this component is meant
 * to render only at `md:` and up (wrap the whole `<Table>` in a
 * `hidden md:block` container at the call site).
 *
 * Visual language borrows the "dense, hairline-bordered rows" idea from
 * Linear's product UI rather than RenTools' own card/shadow language,
 * intentionally — tables need row-to-row rhythm, not per-row elevation.
 * Colors stay on RenTools' own graphite/amber tokens.
 */
export function Table({ className = "", ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded border border-graphite-200 dark:border-graphite-800">
      <table className={["w-full border-collapse text-left", className].join(" ")} {...rest} />
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-graphite-50 dark:bg-graphite-900/60">
      <tr className="border-b border-graphite-200 dark:border-graphite-800">{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({ className = "", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={[
        "px-3 py-2.5 font-body text-[11px] font-semibold uppercase tracking-wide text-graphite-500 dark:text-graphite-400",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">{children}</tbody>;
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export function TableRow({ interactive, className = "", ...rest }: TableRowProps) {
  return (
    <tr
      className={[
        "bg-white transition-colors duration-150 ease-app dark:bg-graphite-900",
        interactive ? "cursor-pointer hover:bg-graphite-50 dark:hover:bg-graphite-800/60" : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

export function TableCell({ className = "", ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={["px-3 py-3 align-middle font-body text-[13px] text-ink dark:text-ink-inverted", className].join(
        " ",
      )}
      {...rest}
    />
  );
}
