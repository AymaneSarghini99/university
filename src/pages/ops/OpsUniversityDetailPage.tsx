import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UniversityLogo } from "@/components/ops/UniversityLogo";
import { resolveCatalogLogoUrl } from "@/lib/libraryLogos";
import { scaffoldUniversityMedia } from "@/lib/scaffoldUniversityMedia";
import { universitySlug } from "@/lib/universitySlug";
import {
  ChevronLeft,
  Mail,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createContact,
  createOffer,
  createProgram,
  BLANK_UNIVERSITY_NAME,
  deleteOpsUniversity,
  fetchContacts,
  fetchOffers,
  fetchOpsUniversity,
  fetchPrograms,
  updateOpsUniversity,
  upsertPartnership,
  verifyOffer,
} from "@/services/opsService";
import {
  OFFER_LABELS,
  OFFER_STATUSES,
  OPERATIONAL_LABELS,
  OPERATIONAL_STATUSES,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_STATUSES,
  type OfferStatus,
  type OperationalStatus,
  type OpsUniversity,
  type ProgramDegreeType,
  type ProgramTeachingLanguage,
  type RelationshipStatus,
  PROGRAM_DEGREE_TYPES,
  PROGRAM_TEACHING_LANGUAGES,
  programMajorCategory,
} from "@/types/ops";
import { VerificationBlock, formatLocation } from "@/components/ops/VerificationBlock";
import {
  OperationalStatusBadge,
  RelationshipStatusBadge,
} from "@/components/ops/OpsStatusBadge";
import { OpsProgramCard, OpsOfferCard } from "@/components/ops/OpsCards";
import { VerifyOfferDialog } from "@/components/ops/VerifyOfferDialog";
import { OpsDialog, OpsTabs } from "@/components/ops/OpsTabs";
import { OpsEmptyState, OpsInlineText, OpsSection } from "@/components/ops/OpsPage";
import { OpsLoading, OpsPanel, OpsPanelBody, OpsPanelHeader } from "@/components/ops/OpsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { CURRENT_PRIMARY_INTAKE } from "@/lib/operatingCycle";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "programs", label: "Programs" },
  { id: "offers", label: "Offers" },
  { id: "contacts", label: "Contacts" },
  { id: "partnership", label: "Partnership" },
];

type IdentityField = "name" | "chinese_name" | "city" | "province" | "website";

function websiteHref(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

export default function OpsUniversityDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const [tab, setTab] = useState("overview");
  const [programOpen, setProgramOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const uniQ = useQuery({
    queryKey: ["ops-university", id],
    queryFn: () => fetchOpsUniversity(id),
    enabled: Boolean(id),
  });
  const programsQ = useQuery({
    queryKey: ["ops-programs", id],
    queryFn: () => fetchPrograms(id),
    enabled: Boolean(id),
  });
  const offersQ = useQuery({
    queryKey: ["ops-offers", id],
    queryFn: () => fetchOffers({ universityId: id }),
    enabled: Boolean(id),
  });
  const contactsQ = useQuery({
    queryKey: ["ops-contacts", id],
    queryFn: () => fetchContacts(id),
    enabled: Boolean(id),
  });

  const [programName, setProgramName] = useState("");
  const [degreeType, setDegreeType] = useState<ProgramDegreeType>("Chinese Language");
  const [language, setLanguage] = useState<ProgramTeachingLanguage>("Chinese");
  const [offerProgramId, setOfferProgramId] = useState("");
  const [intake, setIntake] = useState(CURRENT_PRIMARY_INTAKE);
  const [tuition, setTuition] = useState("10000");
  const [offerStatus, setOfferStatus] = useState<OfferStatus>("potential");
  const [infoSource, setInfoSource] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactWechat, setContactWechat] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [verifyOfferId, setVerifyOfferId] = useState<string | null>(null);
  const [verifyOfferLabel, setVerifyOfferLabel] = useState("");

  const operationalStatusMutation = useMutation({
    mutationFn: (status: OperationalStatus) => updateOpsUniversity(id, { status }),
    onSuccess: () => {
      toast({ title: "Operational status updated" });
      qc.invalidateQueries({ queryKey: ["ops-university", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: (patch: Partial<OpsUniversity>) => updateOpsUniversity(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-university", id] });
      qc.invalidateQueries({ queryKey: ["ops-universities"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) =>
      toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const saveIdentityField =
    (field: IdentityField) => async (value: string | null) => {
      if (field === "name" && !value?.trim()) {
        toast({ title: "Name is required", variant: "destructive" });
        return;
      }

      const patch: Partial<OpsUniversity> = { [field]: value };
      if (field === "name" && value?.trim()) {
        const current = uniQ.data;
        if (current && !current.slug && !current.public_catalog_slug) {
          const slug = universitySlug(value.trim());
          patch.slug = slug;
          patch.public_catalog_slug = slug;
        }
      }

      await updateFieldMutation.mutateAsync(patch);

      if (field === "name" && value?.trim()) {
        const slug =
          patch.slug ??
          uniQ.data?.slug ??
          uniQ.data?.public_catalog_slug ??
          universitySlug(value.trim());
        await scaffoldUniversityMedia(value.trim(), slug);
      }
    };

  const removeMutation = useMutation({
    mutationFn: () => deleteOpsUniversity(id),
    onSuccess: () => {
      toast({ title: "University removed" });
      qc.invalidateQueries({ queryKey: ["ops-universities"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
      qc.invalidateQueries({ queryKey: ["ops-library-search"] });
      navigate("/ops/universities");
    },
    onError: (e: Error) =>
      toast({ title: "Could not remove", description: e.message, variant: "destructive" }),
  });

  const relationshipMutation = useMutation({
    mutationFn: (relationship_status: RelationshipStatus) =>
      upsertPartnership(id, { relationship_status }),
    onSuccess: () => {
      toast({ title: "Relationship updated" });
      qc.invalidateQueries({ queryKey: ["ops-university", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
  });

  const followUpMutation = useMutation({
    mutationFn: (days: number) =>
      upsertPartnership(id, {
        last_contacted_at: new Date().toISOString(),
        next_follow_up_at: new Date(Date.now() + days * 86400000).toISOString(),
      }),
    onSuccess: () => {
      toast({ title: "Scheduled" });
      qc.invalidateQueries({ queryKey: ["ops-university", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
  });

  const programMutation = useMutation({
    mutationFn: () =>
      createProgram({
        university_id: id,
        name: programName,
        degree_type: degreeType,
        teaching_language: language,
        major_category: programMajorCategory(degreeType),
      }),
    onSuccess: () => {
      toast({ title: "Added" });
      setProgramName("");
      setDegreeType("Chinese Language");
      setLanguage("Chinese");
      setProgramOpen(false);
      qc.invalidateQueries({ queryKey: ["ops-programs", id] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const offerMutation = useMutation({
    mutationFn: () =>
      createOffer({
        university_id: id,
        program_id: offerProgramId,
        intake,
        tuition: Number(tuition) || null,
        currency: "CNY",
        status: offerStatus,
        info_source: infoSource || null,
        last_verified_at: offerStatus === "active" ? new Date().toISOString() : null,
        verified_by: offerStatus === "active" ? user?.id ?? null : null,
      }),
    onSuccess: () => {
      toast({ title: "Added" });
      setOfferOpen(false);
      qc.invalidateQueries({ queryKey: ["ops-offers", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const contactMutation = useMutation({
    mutationFn: () =>
      createContact({
        university_id: id,
        name: contactName,
        wechat: contactWechat || null,
        email: contactEmail || null,
        contact_type: "international_office",
      }),
    onSuccess: () => {
      toast({ title: "Added" });
      setContactName("");
      setContactWechat("");
      setContactEmail("");
      setContactOpen(false);
      qc.invalidateQueries({ queryKey: ["ops-contacts", id] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (input: { offerId: string; infoSource: string; sourceUrl: string; verificationNotes: string }) =>
      verifyOffer(input.offerId, {
        infoSource: input.infoSource,
        sourceUrl: input.sourceUrl || null,
        verifiedBy: user?.id ?? null,
        verificationNotes: input.verificationNotes || null,
      }),
    onSuccess: () => {
      toast({ title: "Offer verified & active" });
      setVerifyOfferId(null);
      qc.invalidateQueries({ queryKey: ["ops-offers", id] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const uni = uniQ.data;
  const activeOffers = useMemo(
    () => (offersQ.data ?? []).filter((o) => o.status === "active").length,
    [offersQ.data],
  );

  if (uniQ.isLoading) return <OpsLoading />;
  if (uniQ.isError) {
    return (
      <OpsEmptyState
        title="Could not load"
        description={uniQ.error instanceof Error ? uniQ.error.message : undefined}
        action={
          <Button variant="outline" onClick={() => uniQ.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!uni) {
    return (
      <OpsEmptyState
        title="Not found"
        action={
          <Button asChild variant="outline">
            <Link to="/ops/universities">Back</Link>
          </Button>
        }
      />
    );
  }

  const operationalStatus = uni.status ?? "research";
  const relationshipStatus = uni.partnership?.relationship_status ?? "no_relationship";
  const isBlankStub = uni.name === BLANK_UNIVERSITY_NAME;
  const fieldSaving = updateFieldMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        to="/ops/universities"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Universities
      </Link>

      <header className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <UniversityLogo
              slug={uni.public_catalog_slug ?? uni.slug}
              logoUrl={uni.logo_url ?? resolveCatalogLogoUrl(uni.public_catalog_slug ?? uni.slug, null)}
              name={uni.name}
              className="h-14 w-14 shrink-0"
              imgClassName="h-10 w-10"
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{uni.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatLocation([uni.city, uni.province, uni.country])}
                {uni.chinese_name ? ` · ${uni.chinese_name}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <OperationalStatusBadge status={operationalStatus} />
                <RelationshipStatusBadge status={relationshipStatus} />
                <span className="text-xs text-muted-foreground">
                  Offers · {activeOffers}
                </span>
                <span className="text-xs text-muted-foreground">
                  Programs · {programsQ.data?.length ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setProgramOpen(true)}>
              <Plus className="h-4 w-4" /> Program
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOfferOpen(true)}>
              <Plus className="h-4 w-4" /> Offer
            </Button>
            <Button variant="outline" size="sm" onClick={() => setContactOpen(true)}>
              <Plus className="h-4 w-4" /> Contact
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
              title="Remove from ops"
              aria-label="Remove from ops"
              onClick={() => setRemoveOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <OpsTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <OpsPanel className="lg:col-span-2">
            <OpsPanelHeader title="University" />
            <OpsPanelBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Name</dt>
                  <dd className="mt-1 font-medium">
                    <OpsInlineText
                      value={uni.name}
                      placeholder="University name"
                      emptyLabel="—"
                      required
                      autoEdit={isBlankStub}
                      saving={fieldSaving}
                      onSave={saveIdentityField("name")}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Chinese name</dt>
                  <dd className="mt-1">
                    <OpsInlineText
                      value={uni.chinese_name}
                      placeholder="Chinese name"
                      emptyLabel="—"
                      saving={fieldSaving}
                      onSave={saveIdentityField("chinese_name")}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">City</dt>
                  <dd className="mt-1">
                    <OpsInlineText
                      value={uni.city}
                      placeholder="City"
                      emptyLabel="—"
                      saving={fieldSaving}
                      onSave={saveIdentityField("city")}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Province</dt>
                  <dd className="mt-1">
                    <OpsInlineText
                      value={uni.province}
                      placeholder="Province"
                      emptyLabel="—"
                      saving={fieldSaving}
                      onSave={saveIdentityField("province")}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Website</dt>
                  <dd className="mt-1">
                    <OpsInlineText
                      value={uni.website}
                      placeholder="https://…"
                      emptyLabel="—"
                      saving={fieldSaving}
                      onSave={saveIdentityField("website")}
                      renderDisplay={(url) => (
                        <a
                          href={websiteHref(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {url}
                        </a>
                      )}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Source</dt>
                  <dd className="mt-1 text-sm capitalize">{uni.record_source.replace(/_/g, " ")}</dd>
                </div>
              </dl>
            </OpsPanelBody>
          </OpsPanel>

          <OpsPanel>
            <OpsPanelHeader title="Next action" />
            <OpsPanelBody>
              <p className="text-sm font-medium">
                {uni.partnership?.next_follow_up_at
                  ? new Date(uni.partnership.next_follow_up_at).toLocaleDateString()
                  : "—"}
              </p>
            </OpsPanelBody>
          </OpsPanel>
        </div>
      )}

      {tab === "programs" && (
        <OpsSection
          title="Programs"
          action={
            <Button size="sm" onClick={() => setProgramOpen(true)}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          }
        >
          {(programsQ.data ?? []).length === 0 ? (
            <OpsEmptyState
              title="No programs"
              action={
                <Button onClick={() => setProgramOpen(true)}>Add</Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(programsQ.data ?? []).map((p) => (
                <OpsProgramCard
                  key={p.id}
                  name={p.name}
                  degreeType={p.degree_type}
                  language={p.teaching_language}
                  duration={p.duration}
                  intakeHint="September Intake"
                />
              ))}
            </div>
          )}
        </OpsSection>
      )}

      {tab === "offers" && (
        <OpsSection
          title="Offers"
          action={
            <Button size="sm" onClick={() => setOfferOpen(true)}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          }
        >
          {(offersQ.data ?? []).length === 0 ? (
            <OpsEmptyState
              title="No offers"
              action={<Button onClick={() => setOfferOpen(true)}>Add</Button>}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {(offersQ.data ?? []).map((o) => (
                <OpsOfferCard
                  key={o.id}
                  programName={o.program?.name}
                  intake={o.intake}
                  status={o.status}
                  tuition={o.tuition}
                  currency={o.currency}
                  scholarship={o.scholarship_type ?? undefined}
                  deadline={o.deadline ?? undefined}
                  infoSource={o.info_source}
                  lastVerifiedAt={o.last_verified_at}
                  sourceUrl={o.source_url}
                  actions={
                    <>
                      {o.status !== "active" || !o.last_verified_at ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setVerifyOfferId(o.id);
                            setVerifyOfferLabel(`${o.program?.name ?? "Program"} · ${o.intake}`);
                          }}
                        >
                          Verify
                        </Button>
                      ) : null}
                    </>
                  }
                />
              ))}
            </div>
          )}
        </OpsSection>
      )}

      {tab === "contacts" && (
        <OpsSection
          title="Contacts"
          action={
            <Button size="sm" onClick={() => setContactOpen(true)}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          }
        >
          {(contactsQ.data ?? []).length === 0 ? (
            <OpsEmptyState
              title="No contacts"
              action={<Button onClick={() => setContactOpen(true)}>Add</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(contactsQ.data ?? []).map((c) => (
                <article
                  key={c.id}
                  className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm"
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.position || "International Office"}
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {c.email ? (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {c.email}
                      </p>
                    ) : null}
                    {c.wechat ? (
                      <p className="flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" /> {c.wechat}
                      </p>
                    ) : null}
                  </div>
                  {c.next_follow_up_at ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {new Date(c.next_follow_up_at).toLocaleDateString()}
                    </p>
                  ) : null}
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => followUpMutation.mutate(7)}>
                    Follow up
                  </Button>
                </article>
              ))}
            </div>
          )}
        </OpsSection>
      )}

      {tab === "partnership" && (
        <OpsPanel>
          <OpsPanelHeader title="Status" />
          <OpsPanelBody className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Operational status</p>
              <OperationalStatusBadge status={operationalStatus} />
              <Select
                value={operationalStatus}
                onValueChange={(v) => operationalStatusMutation.mutate(v as OperationalStatus)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATIONAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {OPERATIONAL_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Relationship status</p>
              <RelationshipStatusBadge status={relationshipStatus} />
              <Select
                value={relationshipStatus}
                onValueChange={(v) => relationshipMutation.mutate(v as RelationshipStatus)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {RELATIONSHIP_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Follow up</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => followUpMutation.mutate(3)}>
                  +3d
                </Button>
                <Button variant="outline" size="sm" onClick={() => followUpMutation.mutate(7)}>
                  +7d
                </Button>
              </div>
              {uni.partnership?.next_follow_up_at ? (
                <p className="text-xs text-muted-foreground">
                  {new Date(uni.partnership.next_follow_up_at).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </OpsPanelBody>
        </OpsPanel>
      )}

      <OpsDialog
        open={programOpen}
        onClose={() => setProgramOpen(false)}
        title="Add program"
        footer={
          <>
            <Button variant="outline" onClick={() => setProgramOpen(false)}>Cancel</Button>
            <Button disabled={!programName.trim() || programMutation.isPending} onClick={() => programMutation.mutate()}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Program name</label>
            <Input
              placeholder="e.g. Chinese Language Program"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Degree type</label>
            <Select value={degreeType} onValueChange={(v) => setDegreeType(v as ProgramDegreeType)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Degree type" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_DEGREE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Language</label>
            <Select value={language} onValueChange={(v) => setLanguage(v as ProgramTeachingLanguage)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_TEACHING_LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </OpsDialog>

      <OpsDialog
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        title="Add offer"
        footer={
          <>
            <Button variant="outline" onClick={() => setOfferOpen(false)}>Cancel</Button>
            <Button disabled={!offerProgramId || !intake || offerMutation.isPending} onClick={() => offerMutation.mutate()}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select value={offerProgramId} onValueChange={setOfferProgramId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              {(programsQ.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Intake e.g. 2027-09" value={intake} onChange={(e) => setIntake(e.target.value)} className="rounded-xl" />
          <Input placeholder="Tuition ¥" value={tuition} onChange={(e) => setTuition(e.target.value)} className="rounded-xl" />
          <Select value={offerStatus} onValueChange={(v) => setOfferStatus(v as OfferStatus)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OFFER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {OFFER_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Source (e.g. Official PDF)" value={infoSource} onChange={(e) => setInfoSource(e.target.value)} className="rounded-xl" />
        </div>
      </OpsDialog>

      <OpsDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Add contact"
        footer={
          <>
            <Button variant="outline" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button disabled={!contactName.trim() || contactMutation.isPending} onClick={() => contactMutation.mutate()}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input placeholder="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} className="rounded-xl" />
          <Input placeholder="WeChat" value={contactWechat} onChange={(e) => setContactWechat(e.target.value)} className="rounded-xl" />
          <Input placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="rounded-xl" />
        </div>
      </OpsDialog>

      <OpsDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove university?"
        description={`Remove ${uni.name} from ops? Programs, offers, and contacts for this university will be deleted. It can be added again from Library.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
            >
              Remove
            </Button>
          </>
        }
      />

      <VerifyOfferDialog
        open={Boolean(verifyOfferId)}
        onClose={() => setVerifyOfferId(null)}
        offerLabel={verifyOfferLabel}
        loading={verifyMutation.isPending}
        onConfirm={(input) => {
          if (!verifyOfferId) return;
          verifyMutation.mutate({ offerId: verifyOfferId, ...input });
        }}
      />
    </div>
  );
}
