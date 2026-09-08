import { useRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import type {
  CategoryConfig,
  StatementType,
  Transaction,
  TransactionOrigin,
} from "@aletheia/shared";
import { cleanPayeeName, getCategoryColorFromConfig } from "@aletheia/shared";
import { formatBRL, resolveLocale } from "../i18n";
import { useTheme } from "../theme/ThemeContext";
import { Card } from "./ui";

function formatDate(raw: string): string {
  let date: Date;
  if (raw.includes("-")) {
    const [y, m, d] = raw.split("-");
    date = new Date(Number(y), Number(m) - 1, Number(d));
  } else if (raw.includes("/")) {
    const [d, m, y] = raw.split("/");
    date = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    return raw;
  }
  return date.toLocaleDateString(resolveLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SourceBadge({ source }: { source?: "bank" | "card" }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  if (!source) return null;
  const isBank = source === "bank";
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: isBank
            ? isDark
              ? "#312e81"
              : "#eef2ff"
            : isDark
              ? "#78350f"
              : "#fef3c7",
        },
      ]}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: isBank ? (isDark ? "#a5b4fc" : "#4338ca") : isDark ? "#fcd34d" : "#b45309",
        }}
      >
        {source === "bank" ? t("table.bank") : t("table.card")}
      </Text>
    </View>
  );
}

function MetaChip({ label, backgroundColor, color }: { label: string; backgroundColor: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text style={{ fontSize: 11, fontWeight: "600", color }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function OriginLabel({ origin }: { origin?: TransactionOrigin }) {
  const { colors } = useTheme();
  return (
    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, opacity: 0.55 }}>
      {origin === "openfinance" ? "API" : "CSV"}
    </Text>
  );
}

function SwipeAction({
  label,
  icon,
  backgroundColor,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.swipeAction, { backgroundColor }]}>
      <Ionicons name={icon} size={22} color="#fff" />
      <Text style={styles.swipeLabel}>{label}</Text>
    </View>
  );
}

export interface CardLayout {
  showSource: boolean;
  showCategory: boolean;
  showInstallment: boolean;
  hasAvatars: boolean;
}

export function getCardLayout(
  statementType: StatementType,
  hasAvatars: boolean,
  showCategory: boolean,
): CardLayout {
  return {
    showSource: statementType === "family",
    showCategory,
    showInstallment: statementType === "card" || statementType === "family",
    hasAvatars,
  };
}

export interface TransactionCardProps {
  tx: Transaction;
  globalIdx: number;
  category: string;
  layout: CardLayout;
  catConfig?: CategoryConfig | null;
  accountNameMap?: Map<string, string>;
  hasActions: boolean;
  nested?: boolean;
  onHide?: (payload: { globalIndex: number }) => void;
  onOpenModal: (payload: { transaction: Transaction; globalIndex: number; category: string }) => void;
}

export function TransactionCard({
  tx,
  globalIdx,
  category,
  layout,
  catConfig,
  accountNameMap,
  hasActions,
  nested = false,
  onHide,
  onOpenModal,
}: TransactionCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const isHidden = !!tx.hidden;
  const canTag = hasActions && !isHidden;
  const canSwipe = !!onHide || canTag;
  const categoryColor = getCategoryColorFromConfig(category, catConfig ?? null);
  const accountName = tx.accountId ? accountNameMap?.get(tx.accountId) : undefined;
  const amountColor = isHidden
    ? colors.textMuted
    : tx.amount >= 0
      ? "#16a34a"
      : colors.text;
  const strike = isHidden ? ("line-through" as const) : ("none" as const);
  const hideLabel = isHidden ? t("table.unhide") : t("table.hide");
  const tagLabel = t("table.tag");

  const body = (
    <View
      style={[styles.cardBody, { opacity: isHidden ? 0.45 : 1 }]}
      accessible
      accessibilityLabel={`${cleanPayeeName(tx.payee)}, ${formatBRL(tx.amount)}`}
      accessibilityActions={[
        ...(onHide ? [{ name: "hide" as const, label: hideLabel }] : []),
        ...(canTag ? [{ name: "tag" as const, label: tagLabel }] : []),
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "hide" && onHide) {
          onHide({ globalIndex: globalIdx });
        }
        if (event.nativeEvent.actionName === "tag" && canTag) {
          onOpenModal({ transaction: tx, globalIndex: globalIdx, category });
        }
      }}
    >
      {layout.hasAvatars && (
        <View style={styles.avatarWrap}>
          {tx.uploadedBy?.picture ? (
            <Image source={{ uri: tx.uploadedBy.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]} />
          )}
        </View>
      )}

      <View style={styles.cardMain}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.payee,
              { color: isHidden ? colors.textMuted : colors.text, textDecorationLine: strike },
            ]}
            numberOfLines={2}
          >
            {cleanPayeeName(tx.payee)}
          </Text>
          <Text
            style={[
              styles.amount,
              { color: amountColor, textDecorationLine: strike },
            ]}
            numberOfLines={1}
          >
            {formatBRL(tx.amount)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(tx.date)}</Text>
          <OriginLabel origin={tx.origin} />
          {layout.showSource && <SourceBadge source={tx.source} />}
          {accountName ? (
            <MetaChip label={accountName} backgroundColor={colors.border} color={colors.textMuted} />
          ) : null}
          {layout.showInstallment && tx.installment ? (
            <MetaChip
              label={tx.installment}
              backgroundColor={colors.primaryMutedBg}
              color={colors.primaryText}
            />
          ) : null}
        </View>

        {layout.showCategory ? (
          <View style={styles.categoryChip}>
            <View style={[styles.dot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.categoryLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {category}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const card = nested ? (
    <View
      style={[
        styles.nestedCard,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      {body}
    </View>
  ) : (
    <Card>{body}</Card>
  );

  if (!canSwipe) return card;

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootFriction={8}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      activeOffsetX={[-15, 15]}
      failOffsetY={[-12, 12]}
      containerStyle={nested ? styles.nestedSwipe : styles.cardSwipe}
      renderLeftActions={
        canTag
          ? () => (
              <SwipeAction
                label={tagLabel}
                icon="pricetag-outline"
                backgroundColor={colors.primary}
              />
            )
          : undefined
      }
      renderRightActions={
        onHide
          ? () => (
              <SwipeAction
                label={hideLabel}
                icon={isHidden ? "eye-outline" : "eye-off-outline"}
                backgroundColor={isHidden ? colors.primary : colors.danger}
              />
            )
          : undefined
      }
      onSwipeableOpen={(direction) => {
        if (direction === "left" && canTag) {
          swipeableRef.current?.close();
          onOpenModal({ transaction: tx, globalIndex: globalIdx, category });
          return;
        }
        if (direction === "right" && onHide) {
          onHide({ globalIndex: globalIdx });
          swipeableRef.current?.close();
        }
      }}
    >
      {card}
    </Swipeable>
  );
}

interface ListProps {
  layout: CardLayout;
  rows: { tx: Transaction; category: string; globalIndex: number }[];
  catConfig?: CategoryConfig | null;
  accountNameMap?: Map<string, string>;
  hasActions: boolean;
  nested?: boolean;
  onHide?: (payload: { globalIndex: number }) => void;
  onOpenModal: (payload: { transaction: Transaction; globalIndex: number; category: string }) => void;
}

export function TransactionCardList({
  layout,
  rows,
  catConfig,
  accountNameMap,
  hasActions,
  nested = false,
  onHide,
  onOpenModal,
}: ListProps) {
  return (
    <View style={nested ? styles.nestedList : styles.list}>
      {rows.map(({ tx, category, globalIndex }, idx) => (
        <TransactionCard
          key={`${globalIndex}-${idx}-${tx.date}`}
          tx={tx}
          globalIdx={globalIndex}
          category={category}
          layout={layout}
          catConfig={catConfig}
          accountNameMap={accountNameMap}
          hasActions={hasActions}
          nested={nested}
          onHide={onHide}
          onOpenModal={onOpenModal}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  nestedList: { gap: 8, padding: 10 },
  nestedSwipe: { borderRadius: 10, overflow: "hidden" },
  cardSwipe: { borderRadius: 12, overflow: "hidden" },
  nestedCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
  },
  avatarWrap: { paddingTop: 2 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholder: { width: 28, height: 28, borderRadius: 14 },
  cardMain: { flex: 1, gap: 6, minWidth: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  payee: { flex: 1, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  amount: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  date: { fontSize: 12, fontWeight: "500" },
  chip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 160,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  categoryLabel: { fontSize: 12, fontWeight: "500", flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  swipeAction: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  swipeLabel: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
