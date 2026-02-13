"use client";

import ScheduleSection from "./ScheduleSection";
import RestaurantsSection from "./RestaurantsSection";
import GrocerySection from "./GrocerySection";
import WildcardsSection from "./WildcardsSection";
import DjSection from "./DjSection";
import FlightsSection from "./FlightsSection";
import RoomsSection from "./RoomsSection";
import GallerySection from "./GallerySection";
import VillaSection from "./VillaSection";
import DisplayNameModal from "../DisplayNameModal";

interface AllSectionsProps {
  isAdmin: boolean;
}

export default function AllSections({ isAdmin }: AllSectionsProps) {
  return (
    <>
      <DisplayNameModal />
      <WildcardsSection />
      <RestaurantsSection isAdmin={isAdmin} />
      <GrocerySection />
      <DjSection isAdmin={isAdmin} />
      <FlightsSection />
      <RoomsSection isAdmin={isAdmin} />
      <GallerySection />
      <VillaSection />
      {isAdmin && <ScheduleSection isAdmin={isAdmin} />}
    </>
  );
}
