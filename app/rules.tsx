import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Card, Chip, Field, Heading, Muted, PrimaryButton, Row, Screen } from '@/src/components/ui';
import { useAppStore } from '@/src/store/appStore';

export default function RulesScreen() {
  const rules = useAppStore((state) => state.merchantRules);
  const categories = useAppStore((state) => state.categories);
  const addMerchantRule = useAppStore((state) => state.addMerchantRule);
  const removeMerchantRule = useAppStore((state) => state.removeMerchantRule);
  const [match, setMatch] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Heading>New rule</Heading>
          <Field label="Merchant contains" value={match} onChangeText={setMatch} placeholder="kroger" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                active={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
          <PrimaryButton
            label="Save rule"
            onPress={() => {
              if (!match.trim()) {
                Alert.alert('Add a merchant snippet');
                return;
              }
              addMerchantRule(match, categoryId);
              setMatch('');
            }}
          />
        </Card>

        {rules.map((rule) => {
          const category = categories.find((item) => item.id === rule.categoryId);
          return (
            <Card key={rule.id} onPress={() => removeMerchantRule(rule.id)}>
              <Row>
                <View style={{ flex: 1 }}>
                  <Heading>{rule.match}</Heading>
                  <Muted>{category?.name ?? rule.categoryId}</Muted>
                </View>
                <Muted>Tap to delete</Muted>
              </Row>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
