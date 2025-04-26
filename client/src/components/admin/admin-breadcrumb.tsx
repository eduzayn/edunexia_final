import React from "react";
import { Link } from "wouter";
import { ChevronRightIcon, HomeIcon } from "lucide-react";

interface BreadcrumbItem {
  title: string;
  link?: string;
  active?: boolean;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index === 0 ? (
              <div className="inline-flex items-center">
                {item.link ? (
                  <Link href={item.link} className="flex items-center">
                    <HomeIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      {item.title}
                    </span>
                  </Link>
                ) : (
                  <span className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <HomeIcon className="h-4 w-4 mr-2" />
                    {item.title}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                {item.link ? (
                  <Link
                    href={item.link}
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white md:ml-2"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span
                    className={`ml-1 text-sm font-medium md:ml-2 ${
                      item.active
                        ? "text-primary font-semibold"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {item.title}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}