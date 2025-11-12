import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { Button, Group, Textarea } from "@mantine/core";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editorValue, setEditorValue] = React.useState<string>("{}");
  const getJson = useJson(state => state.getJson);
  const setContents = useFile(state => state.setContents);

  React.useEffect(() => {
    setIsEditing(false);
    setEditorValue(normalizeNodeData(nodeData?.text ?? []));
  }, [nodeData]);

  // apply value at JSON path (jsonPath is array of keys/numbers)
  const setValueAtPath = (jsonObj: any, path: NodeData["path"], value: any) => {
    if (!path || path.length === 0) return value; // replace root
    const cloned = Array.isArray(jsonObj) ? [...jsonObj] : { ...jsonObj };
    let cur: any = cloned;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      const isLast = i === path.length - 1;
      if (isLast) {
        if (typeof key === "number" && Array.isArray(cur)) cur[key] = value;
        else cur[key as any] = value;
      } else {
        if (cur[key as any] === undefined) {
          // create object or array depending on next key
          const nextKey = path[i + 1];
          cur[key as any] = typeof nextKey === "number" ? [] : {};
        }
        cur = cur[key as any];
      }
    }
    return cloned;
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Group spacing="xs">
              {!isEditing && (
                <Button size="xs" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              <CloseButton onClick={onClose} />
            </Group>
          </Flex>
          <ScrollArea.Autosize mah={250} maw={600}>
            {!isEditing ? (
              <CodeHighlight
                code={normalizeNodeData(nodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            ) : (
              <Textarea
                value={editorValue}
                onChange={e => setEditorValue(e.currentTarget.value)}
                minRows={6}
                style={{ fontFamily: "monospace" }}
              />
            )}
          </ScrollArea.Autosize>
          {isEditing && (
            <Group position="right">
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  // cancel
                  setIsEditing(false);
                  setEditorValue(normalizeNodeData(nodeData?.text ?? []));
                }}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(editorValue);
                    const current = JSON.parse(getJson());
                    const updated = setValueAtPath(current, nodeData?.path, parsed);
                    const updatedStr = JSON.stringify(updated, null, 2);
                    // update left editor contents which will update graph via stores
                    setContents({ contents: updatedStr, hasChanges: true });
                    setIsEditing(false);
                    onClose();
                  } catch (err) {
                    // keep editing; could integrate toast error
                    console.error("Failed to save node edit", err);
                  }
                }}
              >
                Save
              </Button>
            </Group>
          )}
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
