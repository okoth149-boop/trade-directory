'use client';

import { Business, Product } from '@/lib/api';
import { A4ExportWrapper } from './a4-export-wrapper';
import { Orientation } from '@/lib/a4-export-utils';

interface ExporterProfileExportLayoutSimpleProps {
  business: Business & {
    latitude?: number;
    longitude?: number;
    email?: string;
    websiteUrl?: string;
    companyEmail?: string;
    companyPhoneNumber?: string;
    whatsappNumber?: string;
    companySize?: string;
    exportVolumePast3Years?: string;
    productionCapacityPast3?: string;
    annualRevenue?: string;
    twitterUrl?: string;
    instagramUrl?: string;
    exportExperience?: string;
    exportCapacity?: string;
  };
  businessRating?: number;
  orientation: Orientation;
  quality?: 'screen' | 'print' | 'high';
}

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '24px', height: '24px' }} xmlns="http://www.w3.org/2000/svg">
    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.7L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
  </svg>
);

export function ExporterProfileExportLayoutSimple({
  business,
  businessRating,
  orientation,
  quality = 'print',
}: ExporterProfileExportLayoutSimpleProps) {
  const products = business.products || [];
  const businessAge = business.yearEstablished
    ? new Date().getFullYear() - Number(business.yearEstablished)
    : null;

  const isPortrait = orientation === 'portrait';

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <span key={`full-${i}`} className="text-gray-800 text-lg leading-none">
              ★
            </span>
          ))}
        {hasHalfStar && <span className="text-gray-800 text-lg leading-none">☆</span>}
        {Array(emptyStars)
          .fill(0)
          .map((_, i) => (
            <span key={`empty-${i}`} className="text-gray-400 text-lg leading-none">
              ☆
            </span>
          ))}
        <span className="ml-2 text-base font-bold text-gray-800">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <A4ExportWrapper orientation={orientation} quality={quality}>
      <div className="w-full h-full bg-white p-10 flex flex-col">
        {/* HEADER SECTION - Simple */}
        <div className="mb-5 pb-4 border-b-2 border-gray-900 flex-shrink-0">
          {/* Logo and Company Name Row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            {/* Left: Logo and Company Name */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Company Logo - Simple */}
              <div className="flex-shrink-0">
                {business.logoUrl ? (
                  <div className="w-16 h-16 border-2 border-gray-900 bg-white overflow-hidden">
                    <img
                      src={business.logoUrl}
                      alt={`${business.name} logo`}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-gray-900 bg-white flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {business.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-xl font-bold text-gray-900 leading-tight break-words">
                  {business.name}
                </h1>
              </div>
            </div>

            {/* Right: Verification Badge - Compact */}
            <div className="flex-shrink-0">
              {business.verificationStatus === 'VERIFIED' ? (
                <div className="flex flex-col items-center gap-0.5 px-3 py-2 border-2 border-gray-900">
                  <VerifiedBadge />
                  <span className="text-xs font-bold text-gray-900 uppercase">Verified</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5 px-3 py-2 border-2 border-gray-900">
                  <span className="text-xs font-bold text-gray-700 uppercase">Pending</span>
                </div>
              )}
            </div>
          </div>

          {/* Company Details Row */}
          <div className="space-y-1 text-sm text-gray-700">
            <p>
              {business.location || 'Nairobi'}
              {business.county && business.county !== business.location
                ? `, ${business.county}`
                : ''}
              , Kenya
            </p>

            <p>
              {business.sector || 'Agriculture'}
              {business.yearEstablished && (
                <span> • Est. {business.yearEstablished}
                  {businessAge && <span> ({businessAge} years)</span>}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden">
          <div
            className={`grid gap-5 h-full ${isPortrait ? 'grid-cols-1' : 'grid-cols-2'}`}
          >
            {/* LEFT COLUMN */}
            <div className="space-y-4 overflow-hidden">
              {/* Products & Services */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">
                  Products & Services
                </h2>
                {Array.isArray(products) && products.length > 0 ? (
                  <div className="space-y-2">
                    {products.slice(0, isPortrait ? 10 : 8).map((product: Product, index: number) => (
                      <div key={index} className="text-sm">
                        <p className="font-bold text-gray-900">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{product.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">
                    Premium quality products for export markets
                  </p>
                )}
              </div>

              {/* Business Information */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">
                  Business Information
                </h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-bold text-gray-700">Legal Status: </span>
                    <span className="text-gray-900">{business.typeOfBusiness || 'Limited Company'}</span>
                  </div>
                  {business.registrationNumber && (
                    <div>
                      <span className="font-bold text-gray-700">Registration Number: </span>
                      <span className="text-gray-900">{business.registrationNumber}</span>
                    </div>
                  )}
                  {business.kraPin && (
                    <div>
                      <span className="font-bold text-gray-700">KRA PIN: </span>
                      <span className="text-gray-900">{business.kraPin}</span>
                    </div>
                  )}
                  {business.companySize && (
                    <div>
                      <span className="font-bold text-gray-700">Company Size: </span>
                      <span className="text-gray-900">{business.companySize}</span>
                    </div>
                  )}
                  {business.numberOfEmployees && (
                    <div>
                      <span className="font-bold text-gray-700">Employees: </span>
                      <span className="text-gray-900">{business.numberOfEmployees}</span>
                    </div>
                  )}
                  {business.annualRevenue && (
                    <div>
                      <span className="font-bold text-gray-700">Annual Revenue: </span>
                      <span className="text-gray-900">{business.annualRevenue}</span>
                    </div>
                  )}
                  {business.exportExperience && (
                    <div>
                      <span className="font-bold text-gray-700">Export Experience: </span>
                      <span className="text-gray-900">{business.exportExperience}</span>
                    </div>
                  )}
                  {business.exportVolumePast3Years && (
                    <div>
                      <span className="font-bold text-gray-700">Export Volume (3 Years): </span>
                      <span className="text-gray-900">{business.exportVolumePast3Years}</span>
                    </div>
                  )}
                  {business.productionCapacityPast3 && (
                    <div>
                      <span className="font-bold text-gray-700">Production Capacity: </span>
                      <span className="text-gray-900">{business.productionCapacityPast3}</span>
                    </div>
                  )}
                  {business.exportCapacity && (
                    <div>
                      <span className="font-bold text-gray-700">Export Capacity: </span>
                      <span className="text-gray-900">{business.exportCapacity}</span>
                    </div>
                  )}
                  {business.currentExportMarkets && (
                    <div>
                      <span className="font-bold text-gray-700">Export Markets: </span>
                      <span className="text-gray-900">
                        {Array.isArray(business.currentExportMarkets)
                          ? business.currentExportMarkets.join(', ')
                          : business.currentExportMarkets}
                      </span>
                    </div>
                  )}
                  {businessRating && (
                    <div className="pt-2">
                      <span className="font-bold text-gray-700 block mb-1">Customer Rating:</span>
                      {renderStars(businessRating)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4 overflow-hidden">
              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">
                  Contact Information
                </h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-bold text-gray-700">Email: </span>
                    <span className="text-gray-900 break-all">
                      {business.contactEmail || business.email || 'contact@business.com'}
                    </span>
                  </div>
                  {business.companyEmail && business.companyEmail !== business.contactEmail && (
                    <div>
                      <span className="font-bold text-gray-700">Company Email: </span>
                      <span className="text-gray-900 break-all">{business.companyEmail}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-gray-700">Phone: </span>
                    <span className="text-gray-900">
                      {business.contactPhone || '+254 700 000 000'}
                    </span>
                  </div>
                  {business.companyPhoneNumber && business.companyPhoneNumber !== business.contactPhone && (
                    <div>
                      <span className="font-bold text-gray-700">Company Phone: </span>
                      <span className="text-gray-900">{business.companyPhoneNumber}</span>
                    </div>
                  )}
                  {business.whatsappNumber && (
                    <div>
                      <span className="font-bold text-gray-700">WhatsApp: </span>
                      <span className="text-gray-900">{business.whatsappNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-gray-700">Website: </span>
                    <span className="text-gray-900 break-all">
                      {business.websiteUrl || business.website || 'www.business.com'}
                    </span>
                  </div>
                  {business.physicalAddress && (
                    <div>
                      <span className="font-bold text-gray-700">Address: </span>
                      <span className="text-gray-900">{business.physicalAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">
                  Location
                </h2>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {business.location || 'Nairobi, Kenya'}
                  </p>
                  {business.latitude && business.longitude && (
                    <p className="text-xs text-gray-600 mt-1">
                      Coordinates: {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              {business.certifications && business.certifications.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">
                    Certifications
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {business.certifications.map((cert: any, i: number) => (
                      <span key={i} className="text-xs font-medium text-gray-800 px-2 py-1 border border-gray-900">
                        {cert.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER - Simple like the example */}
        <div className="mt-5 pt-3 border-t-2 border-gray-900 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Kenya Export Promotion & Branding Agency
            </p>
            <p className="text-xs text-gray-700">
              E-Trade Directory • www.keproba.go.ke
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-700">
              Generated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </A4ExportWrapper>
  );
}
