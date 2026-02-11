import {

  IconLayoutDashboard,
  IconPencilPlus,
  IconListCheck,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [

  // {
  //   navlabel: true,
  //   subheader: "HOME",
  // },
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/",
  },
  {
    id: uniqueId(),
    title: "Create SEO Banners",
    icon: IconPencilPlus,
    href: '/create-seo-banners'
  },
  {
    id: uniqueId(),
    title: "Created SEO Banners",
    icon: IconListCheck,
    href: '/created-seo-banners'
  },

  {
    id: uniqueId(),
    title: "Create Blog",
    icon: IconPencilPlus,
    href: "/create-blog",
  },
  {
    id: uniqueId(),
    title: "Created Blogs",
    icon: IconListCheck,
    href: "/created-blogs",
  },
  {
    id: uniqueId(),
    title: "Create Portfolio",
    icon: IconPencilPlus,
    href: "/create-portfolio",
  },
  {
    id: uniqueId(),
    title: "Created Portfolio",
    icon: IconListCheck,
    href: "/created-portfolios",
  },
];

export default Menuitems;


