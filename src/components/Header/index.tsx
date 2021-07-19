import React, { Fragment } from "react";
import { Disclosure } from '@headlessui/react';
import { Props, navigation } from "./types";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaTimes } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import Logo from "./Logo";
import imgLogo from "../../assets/logo.png"
import { AiFillHeart } from "react-icons/ai";

const Header = ({ props }: Props) => {
    return (
        <Disclosure as="nav" className="bg-pirataflix-dark fixed w-full z-40">
            {({ open }) => (
                <Fragment>
                    <div className="max-w-7xl px-2 sm:px-6 lg:px-8">
                        <div className="relative flex items-center justify-between h-16">
                            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                                {/* Mobile menu button*/}
                                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                    <span className="sr-only">Open main menu</span>
                                    {open ? (
                                        <FaTimes className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <GiHamburgerMenu className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                            <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                                <Logo
                                    props={{
                                        logoFile: imgLogo
                                    }}
                                />
                                <div className="hidden sm:block sm:ml-6">
                                    <div className="flex space-x-4">
                                        {navigation.map((item) => (
                                            <NavLink
                                                activeClassName={`text-white font-bold`}
                                                key={item.name}
                                                to={item.to}
                                                className={`px-3 py-2 text-sm text-white`}
                                            >
                                                {item.name}
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                                {/* Profile dropdown */}
                                <Link to={`/minha-lista`}>
                                    <AiFillHeart
                                        size={`1.5rem`}
                                        className={`text-pirataflix-clean_red transform transition duration-150 ease-in-out hover:scale-105`} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Panel */}
                    <Disclosure.Panel className="sm:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navigation.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.to}
                                    className={`${item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} block px-3 py-2 rounded-md text-base font-medium`}
                                    aria-current={item.current ? 'page' : undefined}
                                >
                                    {item.name}
                                </a>
                            ))}
                        </div>
                    </Disclosure.Panel>
                </Fragment>
            )}
        </Disclosure>
    )
}
export default Header;